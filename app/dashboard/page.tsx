// app/dashboard/page.tsx
import { createClient } from "@supabase/supabase-js";
import BottomNavbar from "@/components/BottomNavbar";
import DashboardClient from "@/components/DashboardClient";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

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

type EventsSummary = {
  availableEvents: number;
  userEvents: number;
};

async function getActivities(): Promise<StravaActivity[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("strava_activities")
      .select(
        `
        id,
        athlete_id,
        name,
        type,
        sport_type,
        start_date,
        distance,
        moving_time,
        total_elevation_gain
      `
      )
      .order("start_date", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("Erro ao buscar atividades do Supabase:", error);
      return [];
    }

    return (data ?? []) as StravaActivity[];
  } catch (err) {
    console.error("Erro inesperado ao buscar atividades:", err);
    return [];
  }
}

// Por enquanto fixo com 4 eventos (igual à página /events hoje)
async function getEventsSummary(): Promise<EventsSummary> {
  return {
    availableEvents: 4, // você comentou que agora são 4
    userEvents: 0, // depois conectamos com eventos do usuário
  };
}

export default async function DashboardPage() {
  const activities = await getActivities();
  const eventsSummary = await getEventsSummary();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px", // espaço pro bottom navbar
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <DashboardClient
          activities={activities}
          eventsSummary={eventsSummary}
        />
      </div>

      <BottomNavbar />
    </main>
  );
}
