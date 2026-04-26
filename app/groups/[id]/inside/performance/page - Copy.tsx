// app/groups/[id]/inside/performance/page.tsx
import DashboardClient from "@/components/DashboardClient";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type StravaActivity = {
  id: string;
  athlete_id: number;
  name: string | null;
  type: string | null;
  sport_type: string | null;
  start_date: string | null;
  distance: number | null;
  moving_time: number | null;
  total_elevation_gain: number | null;
};

export default async function GroupPerformancePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { id: communityId } = await params;

  const { data: linkedAthletes } = await supabase
    .from("membership_strava_athletes")
    .select("athlete_id")
    .eq("community_id", communityId);

  const athleteIds = (linkedAthletes ?? []).map((item) => item.athlete_id);

  const { data } = athleteIds.length
    ? await supabase
        .from("strava_activities")
        .select(
          "id, athlete_id, name, type, sport_type, start_date, distance, moving_time, total_elevation_gain"
        )
        .in("athlete_id", athleteIds)
        .order("start_date", { ascending: false })
        .limit(500)
    : { data: [] };

  const activities = (data ?? []) as StravaActivity[];

  const eventsSummary = { availableEvents: 0, userEvents: 0 };

  return (
    <main
      style={{
        padding: 16,
        paddingBottom: 80,
        backgroundColor: "#000",
        color: "#e5e7eb",
        minHeight: "100vh",
      }}
    >
      <DashboardClient activities={activities} eventsSummary={eventsSummary} />
    </main>
  );
}
