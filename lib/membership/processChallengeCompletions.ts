import {
  evaluateChallenge,
  type ActivityForChallenge,
  type ChallengeForEvaluation,
} from "./evaluateChallenge";
import { evaluateRunnerProgress } from "./evaluateRunnerProgress";

type SupabaseLike = {
  from: (table: string) => any;
};

type ImportedActivity = ActivityForChallenge & {
  id: string;
  user_id: string;
  provider?: string | null;
  external_id?: string | null;
  strava_activity_id?: number | null;
  sport_type?: string | null;
  start_date?: string | null;
  distance_m?: number | null;
  moving_time_s?: number | null;
  elapsed_time_s?: number | null;
};

type ChallengeRow = ChallengeForEvaluation & {
  id: string;
  community_id: string;
  title?: string | null;
  points_active?: number | null;
  goal_metric?: string | null;
  runner_level?: string | null;
};

type MembershipRow = {
  community_id: string;
  created_at: string;
  approved_at?: string | null;
};

type ProcessChallengeCompletionsParams = {
  supabase: SupabaseLike;
  userId: string;
  athleteId?: number | string | null;
  activities?: ActivityForChallenge[];
  evaluationStartIso?: string | null;
};

function getThirtyDaysAgoIso() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString();
}

function normalizeActivityType(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function isRunActivity(row: any) {
  const type = normalizeActivityType(
    row.activity_type || row.sport_type || row.type
  );

  return type === "run" || type === "running";
}

function getMembershipStart(row: MembershipRow) {
  return row.approved_at || row.created_at;
}

function mapImportedActivity(row: ImportedActivity): ActivityForChallenge {
  return {
    ...row,
    activity_type: row.sport_type ?? null,
    type: row.sport_type ?? null,
    distance: row.distance_m ?? null,
    moving_time: row.moving_time_s ?? null,
    elapsed_time: row.elapsed_time_s ?? null,
  };
}

export async function processChallengeCompletions({
  supabase,
  userId,
}: ProcessChallengeCompletionsParams) {
  console.log("========== PROCESS CHALLENGES ==========");
  console.log({ userId });

  if (!userId) {
    return {
      checkedActivities: 0,
      activeChallenges: 0,
      matchedChallenges: 0,
      createdCheckins: 0,
    };
  }

  /*
   * Cada comunidade tem sua própria data de entrada.
   * Não usamos mais uma única membershipRow global.
   */
  const { data: membershipRows, error: membershipError } = await supabase
    .from("app_membership_requests")
    .select("community_id,created_at,approved_at")
    .eq("user_id", userId)
    .in("status", ["active", "approved"]);

  if (membershipError) {
    console.error("Error loading memberships:", membershipError);

    return {
      checkedActivities: 0,
      activeChallenges: 0,
      matchedChallenges: 0,
      createdCheckins: 0,
      error: membershipError.message,
    };
  }

  const memberships = (membershipRows ?? []) as MembershipRow[];

  if (memberships.length === 0) {
    return {
      checkedActivities: 0,
      activeChallenges: 0,
      matchedChallenges: 0,
      createdCheckins: 0,
    };
  }

  const communityIds = Array.from(
    new Set(memberships.map((row) => row.community_id))
  );

  const membershipByCommunity = new Map<string, MembershipRow>();

  for (const row of memberships) {
    membershipByCommunity.set(row.community_id, row);
  }

  /*
   * Só avaliamos desafios das comunidades das quais
   * este usuário realmente participa.
   */
  const { data: challenges, error: challengeError } = await supabase
    .from("app_membership_challenges")
    .select(
      "id,community_id,title,activity_type,goal_metric,goal_value,secondary_goal_metric,secondary_goal_operator,secondary_goal_value,points_active,runner_level"
    )
    .eq("is_active", true)
    .eq("is_badge", false)
    .in("community_id", communityIds);

  if (challengeError) {
    console.error(
      "Error loading active membership challenges:",
      challengeError
    );

    return {
      checkedActivities: 0,
      activeChallenges: 0,
      matchedChallenges: 0,
      createdCheckins: 0,
      error: challengeError.message,
    };
  }

  const activeChallenges = (challenges ?? []) as ChallengeRow[];

  if (activeChallenges.length === 0) {
    return {
      checkedActivities: 0,
      activeChallenges: 0,
      matchedChallenges: 0,
      createdCheckins: 0,
    };
  }

  const challengeIds = activeChallenges.map((challenge) => challenge.id);

  const { data: existingCheckins, error: existingError } = await supabase
    .from("app_membership_checkins")
    .select("challenge_id")
    .eq("user_id", userId)
    .eq("is_disregarded", false)
    .in("challenge_id", challengeIds);

  if (existingError) {
    console.error(
      "Error loading existing membership check-ins:",
      existingError
    );
  }

  const alreadyCompleted = new Set(
    ((existingCheckins ?? []) as Array<{ challenge_id: string | null }>)
      .map((row) => row.challenge_id)
      .filter(Boolean) as string[]
  );

  /*
   * Carregamos uma vez as atividades consolidadas do usuário.
   * Strava, Garmin, Health etc. passam pela mesma fonte.
   */
  const { data: importedRows, error: importedError } = await supabase
    .from("imported_activities")
    .select(
      "id,user_id,provider,external_id,strava_activity_id,sport_type,start_date,distance_m,moving_time_s,elapsed_time_s"
    )
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  if (importedError) {
    console.error(
      "Error loading imported activities:",
      importedError
    );

    return {
      checkedActivities: 0,
      activeChallenges: activeChallenges.length,
      matchedChallenges: 0,
      createdCheckins: 0,
      error: importedError.message,
    };
  }

  const importedActivities =
    (importedRows ?? []) as ImportedActivity[];

  const checkinsToInsert: any[] = [];
  const thirtyDaysAgoIso = getThirtyDaysAgoIso();

  for (const challenge of activeChallenges) {
    if (alreadyCompleted.has(challenge.id)) {
      continue;
    }

    const membership =
      membershipByCommunity.get(challenge.community_id);

    if (!membership) {
      continue;
    }

    const membershipStart = getMembershipStart(membership);

    /*
     * Regra:
     * atividade nunca pode contar antes da entrada
     * do usuário nesta comunidade.
     *
     * Para métricas de 30 dias, usamos a data mais recente
     * entre entrada no grupo e 30 dias atrás.
     */
    const now30 =
      new Date(membershipStart) > new Date(thirtyDaysAgoIso)
        ? membershipStart
        : thirtyDaysAgoIso;

    const communityActivities = importedActivities.filter((activity) => {
      if (!activity.start_date) return false;

      return new Date(activity.start_date) >= new Date(membershipStart);
    });

    const recentCommunityActivities =
      communityActivities.filter((activity) => {
        if (!activity.start_date) return false;

        return new Date(activity.start_date) >= new Date(now30);
      });

    const metric = challenge.goal_metric;

    if (metric === "cumulative_distance_30d") {
      const totalDistance = recentCommunityActivities
        .filter(isRunActivity)
        .reduce(
          (sum, row) => sum + Number(row.distance_m ?? 0),
          0
        );

      if (totalDistance >= Number(challenge.goal_value ?? 0)) {
        checkinsToInsert.push({
          community_id: challenge.community_id,
          user_id: userId,
          author_name: "Platform Sports",
          activity_type: "run",
          comment: `Auto check-in: ${
            challenge.title ?? "Cumulative challenge completed"
          }`,
          points: challenge.points_active ?? 0,
          challenge_id: challenge.id,
          imported_activity_id: null,
          strava_activity_id: null,
          is_disregarded: false,
        });

        alreadyCompleted.add(challenge.id);
      }

      continue;
    }

    if (metric === "active_days_30d") {
      const minimumDistance = Number(
        challenge.secondary_goal_value ?? 5000
      );

      const activeDays = new Set(
        recentCommunityActivities
          .filter(isRunActivity)
          .filter(
            (row) =>
              Number(row.distance_m ?? 0) >= minimumDistance
          )
          .map((row) =>
            String(row.start_date || "").slice(0, 10)
          )
          .filter(Boolean)
      );

      if (activeDays.size >= Number(challenge.goal_value ?? 0)) {
        checkinsToInsert.push({
          community_id: challenge.community_id,
          user_id: userId,
          author_name: "Platform Sports",
          activity_type: "run",
          comment: `Auto check-in: ${
            challenge.title ?? "Active days challenge completed"
          }`,
          points: challenge.points_active ?? 0,
          challenge_id: challenge.id,
          imported_activity_id: null,
          strava_activity_id: null,
          is_disregarded: false,
        });

        alreadyCompleted.add(challenge.id);
      }

      continue;
    }

    if (metric === "manual_checkins_30d") {
      continue;
    }

    for (const importedActivity of recentCommunityActivities) {
      const activity = mapImportedActivity(importedActivity);

      if (!evaluateChallenge(activity, challenge)) {
        continue;
      }

      checkinsToInsert.push({
        community_id: challenge.community_id,
        user_id: userId,
        author_name: "Platform Sports",
        activity_type:
          importedActivity.sport_type ?? null,
        comment: `Auto check-in: ${
          challenge.title ?? "Challenge completed"
        }`,
        points: challenge.points_active ?? 0,
        challenge_id: challenge.id,

        imported_activity_id: importedActivity.id,

        /*
         * Compatibilidade:
         * atividades antigas/originadas do Strava continuam
         * preenchendo strava_activity_id.
         */
        strava_activity_id:
          importedActivity.provider === "strava"
            ? importedActivity.strava_activity_id ?? null
            : null,

        is_disregarded: false,
      });

      alreadyCompleted.add(challenge.id);
      break;
    }
  }

  console.log("Check-ins to insert:", checkinsToInsert.length);

  /*
   * Como cada desafio só pode ser concluído uma vez por usuário,
   * já verificamos existingCheckins acima.
   *
   * Insert simples evita depender da antiga constraint
   * baseada exclusivamente em strava_activity_id.
   */
  const insertResult =
    checkinsToInsert.length > 0
      ? await supabase
          .from("app_membership_checkins")
          .insert(checkinsToInsert)
      : { error: null };

  if (insertResult.error) {
    console.error(
      "Error creating automatic membership check-ins:",
      insertResult.error
    );

    return {
      checkedActivities: importedActivities.length,
      activeChallenges: activeChallenges.length,
      matchedChallenges: checkinsToInsert.length,
      createdCheckins: 0,
      error: insertResult.error.message,
    };
  }

  /*
   * Reavalia as camisas/níveis somente das comunidades
   * das quais o usuário participa.
   */
  for (const communityId of communityIds) {
    const progressResult = await evaluateRunnerProgress({
      supabase,
      userId,
      communityId,
    });

    console.log(
      "Runner progress evaluation:",
      communityId,
      progressResult
    );
  }

  return {
    checkedActivities: importedActivities.length,
    activeChallenges: activeChallenges.length,
    matchedChallenges: checkinsToInsert.length,
    createdCheckins: checkinsToInsert.length,
  };
}



