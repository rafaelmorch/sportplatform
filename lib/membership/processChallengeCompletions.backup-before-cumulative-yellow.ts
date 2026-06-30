import { evaluateChallenge, type ActivityForChallenge, type ChallengeForEvaluation } from "./evaluateChallenge";

type SupabaseLike = {
  from: (table: string) => any;
};

type ActivityWithStravaId = ActivityForChallenge & {
  activity_id?: number | string | null;
};

type ChallengeRow = ChallengeForEvaluation & {
  id: string;
  community_id: string;
  title?: string | null;
  points_active?: number | null;
};

type ProcessChallengeCompletionsParams = {
  supabase: SupabaseLike;
  userId: string;
  athleteId: number | string;
  activities: ActivityWithStravaId[];
};

export async function processChallengeCompletions({
  supabase,
  userId,
  athleteId,
  activities,
}: ProcessChallengeCompletionsParams) {
  if (!userId || !athleteId || activities.length === 0) {
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
  const checkinsToInsert: any[] = [];

  for (const activity of activities) {
    for (const challenge of activeChallenges) {
      if (!evaluateChallenge(activity, challenge)) continue;

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
