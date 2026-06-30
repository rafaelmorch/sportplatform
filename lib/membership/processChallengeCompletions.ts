import { evaluateChallenge, type ActivityForChallenge, type ChallengeForEvaluation } from "./evaluateChallenge";

type SupabaseLike = {
  from: (table: string) => any;
};

type ActivityWithStravaId = ActivityForChallenge & {
  activity_id?: number | string | null;
  start_date?: string | null;
  start_date_local?: string | null;
};

type ChallengeRow = ChallengeForEvaluation & {
  id: string;
  community_id: string;
  title?: string | null;
  points_active?: number | null;
  goal_metric?: string | null;
};

type ProcessChallengeCompletionsParams = {
  supabase: SupabaseLike;
  userId: string;
  athleteId: number | string;
  activities: ActivityWithStravaId[];
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
  const type = normalizeActivityType(row.activity_type || row.sport_type || row.type);
  return type === "run";
}

export async function processChallengeCompletions({
  supabase,
  userId,
  athleteId,
  activities,
}: ProcessChallengeCompletionsParams) {
  if (!userId || !athleteId) {
    return { checkedActivities: activities.length, activeChallenges: 0, matchedChallenges: 0, createdCheckins: 0 };
  }

  const { data: challenges, error } = await supabase
    .from("app_membership_challenges")
    .select("id, community_id, title, activity_type, goal_metric, goal_value, secondary_goal_metric, secondary_goal_operator, secondary_goal_value, points_active, runner_level")
    .eq("is_active", true);

  if (error) {
    console.error("Error loading active membership challenges:", error);
    return { checkedActivities: activities.length, activeChallenges: 0, matchedChallenges: 0, createdCheckins: 0, error: error.message };
  }

  const activeChallenges = (challenges ?? []) as ChallengeRow[];
  const challengeIds = activeChallenges.map((challenge) => challenge.id);

  const { data: existingCheckins, error: existingError } = await supabase
    .from("app_membership_checkins")
    .select("challenge_id")
    .eq("user_id", userId)
    .eq("is_disregarded", false)
    .in("challenge_id", challengeIds);

  if (existingError) {
    console.error("Error loading existing membership check-ins:", existingError);
  }

  const alreadyCompleted = new Set(
    ((existingCheckins ?? []) as Array<{ challenge_id: string | null }>)
      .map((row) => row.challenge_id)
      .filter(Boolean) as string[]
  );

  const checkinsToInsert: any[] = [];
  const now30 = getThirtyDaysAgoIso();

  for (const challenge of activeChallenges) {
    if (alreadyCompleted.has(challenge.id)) continue;

    const metric = challenge.goal_metric;

    if (metric === "cumulative_distance_30d") {
      const { data: recentRuns, error: runsError } = await supabase
        .from("strava_activities")
        .select("distance, type, sport_type, start_date")
        .eq("athlete_id", athleteId)
        .gte("start_date", now30);

      if (runsError) {
        console.error("Error loading recent Strava runs:", runsError);
        continue;
      }

      const totalDistance = ((recentRuns ?? []) as any[])
        .filter(isRunActivity)
        .reduce((sum, row) => sum + Number(row.distance ?? 0), 0);

      if (totalDistance >= Number(challenge.goal_value ?? 0)) {
        checkinsToInsert.push({
          community_id: challenge.community_id,
          user_id: userId,
          author_name: "Strava",
          activity_type: "run",
          comment: `Auto check-in from Strava: ${challenge.title ?? "Cumulative challenge completed"}`,
          points: challenge.points_active ?? 0,
          challenge_id: challenge.id,
          strava_activity_id: null,
          is_disregarded: false,
        });
      }

      continue;
    }

    if (metric === "active_days_30d") {
      const { data: recentRuns, error: runsError } = await supabase
        .from("strava_activities")
        .select("type, sport_type, start_date, start_date_local")
        .eq("athlete_id", athleteId)
        .gte("start_date", now30);

      if (runsError) {
        console.error("Error loading recent Strava active days:", runsError);
        continue;
      }

      const activeDays = new Set(
        ((recentRuns ?? []) as any[])
          .filter(isRunActivity)
          .map((row) => String(row.start_date_local || row.start_date || "").slice(0, 10))
          .filter(Boolean)
      );

      if (activeDays.size >= Number(challenge.goal_value ?? 0)) {
        checkinsToInsert.push({
          community_id: challenge.community_id,
          user_id: userId,
          author_name: "Strava",
          activity_type: "run",
          comment: `Auto check-in from Strava: ${challenge.title ?? "Active days challenge completed"}`,
          points: challenge.points_active ?? 0,
          challenge_id: challenge.id,
          strava_activity_id: null,
          is_disregarded: false,
        });
      }

      continue;
    }

    if (metric === "manual_checkins_30d") {
      const { data: manualCheckins, error: manualError } = await supabase
        .from("app_membership_checkins")
        .select("id")
        .eq("user_id", userId)
        .eq("challenge_id", challenge.id)
        .eq("is_disregarded", false)
        .gte("created_at", now30);

      if (manualError) {
        console.error("Error loading manual check-ins:", manualError);
        continue;
      }

      if ((manualCheckins ?? []).length >= Number(challenge.goal_value ?? 0)) {
        continue;
      }

      continue;
    }

    for (const activity of activities) {
      if (evaluateChallenge(activity, challenge)) {
        checkinsToInsert.push({
          community_id: challenge.community_id,
          user_id: userId,
          author_name: "Strava",
          activity_type: activity.activity_type || activity.sport_type || activity.type || null,
          comment: `Auto check-in from Strava: ${challenge.title ?? "Challenge completed"}`,
          points: challenge.points_active ?? 0,
          challenge_id: challenge.id,
          strava_activity_id: activity.activity_id ? Number(activity.activity_id) : null,
          is_disregarded: false,
        });
        break;
      }
    }
  }

  if (checkinsToInsert.length === 0) {
    return {
      checkedActivities: activities.length,
      activeChallenges: activeChallenges.length,
      matchedChallenges: 0,
      createdCheckins: 0,
    };
  }

  const { error: insertError } = await supabase
    .from("app_membership_checkins")
    .upsert(checkinsToInsert, {
      onConflict: "user_id,challenge_id,strava_activity_id",
      ignoreDuplicates: true,
    });

  if (insertError) {
    console.error("Error creating automatic membership check-ins:", insertError);
    return {
      checkedActivities: activities.length,
      activeChallenges: activeChallenges.length,
      matchedChallenges: checkinsToInsert.length,
      createdCheckins: 0,
      error: insertError.message,
    };
  }

  return {
    checkedActivities: activities.length,
    activeChallenges: activeChallenges.length,
    matchedChallenges: checkinsToInsert.length,
    createdCheckins: checkinsToInsert.length,
  };
}
