// app/groups/[id]/inside/performance/page.tsx
import DashboardClient from "@/components/DashboardClient";
import { createClient } from "@supabase/supabase-js";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type StravaActivity = {
  id: string;
  athlete_id: number;
  athlete_name?: string;
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
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { id: communityId } = await params;

  // 🔥 Pega atletas com nome direto da tabela
  const { data: linkedAthletes } = await supabase
    .from("membership_strava_athletes")
    .select("athlete_id, athlete_name")
    .eq("community_id", communityId);

  const athleteIds = (linkedAthletes ?? []).map((a) => a.athlete_id);

  const athleteNameMap = new Map<number, string>();

  (linkedAthletes ?? []).forEach((a) => {
    if (a.athlete_name) {
      athleteNameMap.set(a.athlete_id, a.athlete_name);
    }
  });

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

  const activities = ((data ?? []) as StravaActivity[]).map((a) => ({
    ...a,
    athlete_name:
      athleteNameMap.get(a.athlete_id) ?? `Atleta ${a.athlete_id}`,
  }));

  const eventsSummary = { availableEvents: 0, userEvents: 0 };

return (
  <main
    style={{
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "20px 16px 80px",
      fontFamily: "Montserrat, sans-serif",
    }}
  >
    <div style={{ marginBottom: 12 }}>
      <BackButton />
    </div>

    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
<div style={{ marginBottom: 16 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Performance
          </h1>

          <p
            style={{
              marginTop: 4,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Track your community activity based on Strava data
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 16,
            border: "1px solid #e2e8f0",
          }}
        >
          <DashboardClient
            activities={activities}
            eventsSummary={eventsSummary}
          />
        </div>
      </div>
    </main>
  );
}