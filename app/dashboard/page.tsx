// app/dashboard/page.tsx
import DashboardClient from "@/components/DashboardClient";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type GroupActivity = {
  id: string;
  user_id: string;
  user_name?: string;
  name: string | null;
  type: string | null;
  sport_type: string | null;
  start_date: string | null;
  distance: number | null;
  moving_time: number | null;
  total_elevation_gain: number | null;
};

export default async function DashboardPage() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data } = await supabase
    .from("imported_activities")
    .select(
      "id,user_id,name,sport_type,start_date,distance_m,moving_time_s,elev_gain_m"
    )
    .order("start_date", { ascending: false })
    .limit(500);

  const userIds = Array.from(
    new Set(
      (data ?? [])
        .map((row) => row.user_id)
        .filter((id): id is string => typeof id === "string")
    )
  );

  const { data: profileRows } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", userIds)
    : { data: [] };

  const userNameMap = new Map<string, string>();

  (profileRows ?? []).forEach((profile) => {
    if (profile.id && profile.full_name) {
      userNameMap.set(profile.id, profile.full_name);
    }
  });

  const activities: GroupActivity[] = (data ?? [])
    .filter((row) => typeof row.user_id === "string")
    .map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name:
        userNameMap.get(row.user_id) ?? "Atleta",
      name: row.name ?? null,
      type: row.sport_type ?? null,
      sport_type: row.sport_type ?? null,
      start_date: row.start_date ?? null,
      distance:
        row.distance_m != null
          ? Number(row.distance_m)
          : null,
      moving_time:
        row.moving_time_s != null
          ? Number(row.moving_time_s)
          : null,
      total_elevation_gain:
        row.elev_gain_m != null
          ? Number(row.elev_gain_m)
          : null,
    }));

  const eventsSummary = {
    availableEvents: 0,
    userEvents: 0,
  };

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
      <DashboardClient
        activities={activities}
        eventsSummary={eventsSummary}
      />
    </main>
  );
}
