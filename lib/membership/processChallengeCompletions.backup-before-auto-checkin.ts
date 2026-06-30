import { evaluateChallenge, type ActivityForChallenge, type ChallengeForEvaluation } from "./evaluateChallenge";

type SupabaseLike = {
  from: (table: string) => any;
};

type ProcessChallengeCompletionsParams = {
  supabase: SupabaseLike;
  userId: string;
  athleteId: number | string;
  activities: ActivityForChallenge[];
};

export async function processChallengeCompletions({
  supabase,
  userId,
  athleteId,
  activities,
}: ProcessChallengeCompletionsParams) {
  if (!userId || !athleteId || activities.length === 0) {
    return {
      checkedActivities: activities.length,
      activeChallenges: 0,
      matchedChallenges: 0,
      matches: [],
    };
  }

  const { data: challenges, error } = await supabase
    .from("app_membership_challenges")
    .select(
      "id, community_id, title, activity_type, goal_metric, goal_value, secondary_goal_metric, secondary_goal_operator, secondary_goal_value, points_active, runner_level"
    )
    .eq("is_active", true);

  if (error) {
    console.error("Error loading active membership challenges:", error);
    return {
      checkedActivities: activities.length,
      activeChallenges: 0,
      matchedChallenges: 0,
      matches: [],
      error: error.message,
    };
  }

  const activeChallenges = (challenges ?? []) as ChallengeForEvaluation[];

  const matches: Array<{
    activity: ActivityForChallenge;
    challenge: ChallengeForEvaluation;
  }> = [];

  for (const activity of activities) {
    for (const challenge of activeChallenges) {
      if (evaluateChallenge(activity, challenge)) {
        matches.push({ activity, challenge });
      }
    }
  }

  return {
    checkedActivities: activities.length,
    activeChallenges: activeChallenges.length,
    matchedChallenges: matches.length,
    matches,
  };
}
