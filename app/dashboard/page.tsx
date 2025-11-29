// app/dashboard/page.tsx
import DashboardClient from "@/components/DashboardClient";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

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

export default async function DashboardPage() {
  const supabase = supabaseServer();

  // 🔐 garante que só usuário logado vê o dashboard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 🏃‍♂️ Atividades Strava (ajuste o nome da tabela se for outro)
  const { data: activitiesData, error: activitiesError } = await supabase
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
    .limit(500);

  if (activitiesError) {
    console.error("Erro ao carregar atividades:", activitiesError);
  }

  const activities: StravaActivity[] = (activitiesData ?? []).map((a: any) => ({
    id: String(a.id),
    athlete_id: a.athlete_id,
    name: a.name,
    type: a.type,
    sport_type: a.sport_type,
    start_date: a.start_date,
    distance: a.distance,
    moving_time: a.moving_time,
    total_elevation_gain: a.total_elevation_gain,
  }));

  // 🎯 Resumo de eventos (ajuste nomes das tabelas se precisar)
  const { count: availableEvents, error: eventsError } = await supabase
    .from("events")
    .select("*", { head: true, count: "exact" });

  if (eventsError) {
    console.error("Erro ao contar eventos disponíveis:", eventsError);
  }

  const { count: userEvents, error: userEventsError } = await supabase
    .from("event_registrations")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", user.id);

  if (userEventsError) {
    console.error("Erro ao contar eventos do usuário:", userEventsError);
  }

  const eventsSummary: EventsSummary = {
    availableEvents: availableEvents ?? 0,
    userEvents: userEvents ?? 0,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      <main
        style={{
          flex: 1,
          padding: "16px 16px 80px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <DashboardClient
          activities={activities}
          eventsSummary={eventsSummary}
        />
      </main>

      {/* navbar fixa embaixo */}
      <BottomNavbar />
    </div>
  );
}
