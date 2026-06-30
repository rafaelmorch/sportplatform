export type ActivityForChallenge = {
  activity_type?: string | null;
  type?: string | null;
  sport_type?: string | null;
  distance?: number | null;
  moving_time?: number | null;
  elapsed_time?: number | null;
  total_elevation_gain?: number | null;
  elevation_gain?: number | null;
};

export type ChallengeForEvaluation = {
  activity_type?: string | null;
  goal_metric?: string | null;
  goal_value?: number | string | null;
  secondary_goal_metric?: string | null;
  secondary_goal_operator?: string | null;
  secondary_goal_value?: number | string | null;
};

function normalizeActivityType(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function getActivityMetricValue(activity: ActivityForChallenge, metric?: string | null) {
  switch ((metric || "").trim().toLowerCase()) {
    case "distance":
      return activity.distance ?? null;

    case "moving_time":
      return activity.moving_time ?? null;

    case "elapsed_time":
      return activity.elapsed_time ?? null;

    case "elevation":
    case "total_elevation_gain":
      return activity.total_elevation_gain ?? activity.elevation_gain ?? null;

    default:
      return null;
  }
}

function compareMetric(actual: number | null, operator: string, expected: number) {
  if (actual === null || Number.isNaN(actual)) return false;

  switch (operator) {
    case ">":
      return actual > expected;
    case ">=":
      return actual >= expected;
    case "<":
      return actual < expected;
    case "<=":
      return actual <= expected;
    case "=":
    case "==":
      return actual === expected;
    default:
      return actual >= expected;
  }
}

export function evaluateChallenge(
  activity: ActivityForChallenge,
  challenge: ChallengeForEvaluation
) {
  const challengeActivityType = normalizeActivityType(challenge.activity_type);
  const activityType = normalizeActivityType(
    activity.activity_type || activity.sport_type || activity.type
  );

  if (challengeActivityType && challengeActivityType !== "other" && activityType) {
    if (challengeActivityType !== activityType) {
      return false;
    }
  }

  const mainMetric = challenge.goal_metric;
  const mainExpected = Number(challenge.goal_value);

  if (!mainMetric || Number.isNaN(mainExpected) || mainExpected <= 0) {
    return false;
  }

  const mainActual = getActivityMetricValue(activity, mainMetric);
  const mainPassed = compareMetric(mainActual, ">=", mainExpected);

  if (!mainPassed) {
    return false;
  }

  const secondaryMetric = challenge.secondary_goal_metric;
  const secondaryExpected = Number(challenge.secondary_goal_value);
  const secondaryOperator = challenge.secondary_goal_operator || "<=";

  if (secondaryMetric && !Number.isNaN(secondaryExpected) && secondaryExpected > 0) {
    const secondaryActual = getActivityMetricValue(activity, secondaryMetric);
    return compareMetric(secondaryActual, secondaryOperator, secondaryExpected);
  }

  return true;
}
