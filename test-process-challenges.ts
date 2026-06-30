import { processChallengeCompletions } from "./lib/membership/processChallengeCompletions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

async function main() {
  const result = await processChallengeCompletions({
    supabase,
    userId: "2705dc42-8b3a-4014-bf2c-2fc34a3ba38b",
    athleteId: 11060103,
    activities: [
      {
        activity_type: "run",
        distance: 5000,
        moving_time: 2340,
      },
    ],
  });

  console.log(JSON.stringify(result, null, 2));
}

main();


