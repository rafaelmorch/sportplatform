type SupabaseLike = {
  from: (table: string) => any;
};

const LEVEL_ORDER = ["yellow", "orange", "purple", "dark_blue"];

export async function evaluateRunnerProgress({
  supabase,
  userId,
  communityId,
}: {
  supabase: SupabaseLike;
  userId: string;
  communityId: string;
}) {
  const { data: challenges, error: challengesError } = await supabase
    .from("app_membership_challenges")
    .select("id, runner_level")
    .eq("community_id", communityId)
    .eq("is_active", true);

  if (challengesError) {
    console.error("Error loading runner progress challenges:", challengesError);
    return { promoted: false, error: challengesError.message };
  }

  const { data: checkins, error: checkinsError } = await supabase
    .from("app_membership_checkins")
    .select("challenge_id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .eq("is_disregarded", false);

  if (checkinsError) {
    console.error("Error loading runner progress check-ins:", checkinsError);
    return { promoted: false, error: checkinsError.message };
  }

  const completedIds = new Set(
    ((checkins ?? []) as Array<{ challenge_id: string | null }>)
      .map((row) => row.challenge_id)
      .filter(Boolean) as string[]
  );

  let currentLevel = "yellow";

  for (let index = 0; index < LEVEL_ORDER.length - 1; index += 1) {
    const level = LEVEL_ORDER[index];
    const nextLevel = LEVEL_ORDER[index + 1];

    const levelChallenges = ((challenges ?? []) as Array<{ id: string; runner_level: string | null }>).filter(
      (challenge) => (challenge.runner_level || "yellow") === level
    );

    if (levelChallenges.length === 0) break;

    const completedAll = levelChallenges.every((challenge) => completedIds.has(challenge.id));

    if (!completedAll) break;

    currentLevel = nextLevel;
  }

  const { error: progressError } = await supabase.from("app_membership_runner_progress").upsert(
    {
      community_id: communityId,
      user_id: userId,
      current_level: currentLevel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "community_id,user_id" }
  );

  if (progressError) {
    console.error("Error saving runner progress:", progressError);
    return { promoted: false, currentLevel, error: progressError.message };
  }

  return { promoted: true, currentLevel };
}
