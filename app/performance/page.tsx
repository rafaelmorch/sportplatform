// app/performance/page.tsx
import DashboardClient from "@/components/DashboardClient";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

export default async function PerformancePage() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // ⚠️ Performance não tem sessão server-side aqui (anon). Então:
  // - ou você já tinha essa página funcionando pegando “tudo” mesmo (sem RLS),
  // - ou você já tinha alguma lógica diferente.
  // Para não quebrar build, mantemos simples: tenta pegar atividades (se RLS permitir).
  const { data: activitiesData } = await supabase
    .from("strava_activities")
    .select("id, athlete_id, name, type, sport_type, start_date, distance, moving_time, total_elevation_gain")
    .order("start_date", { ascending: false })
    .limit(200);

  const activities = (activitiesData ?? []) as StravaActivity[];

  const eventsSummary = { availableEvents: 0, userEvents: 0 };

  return (
    <main style={{ padding: 16, paddingBottom: 80 }}>
      <DashboardClient activities={activities} eventsSummary={eventsSummary} />
    </main>
  );
}
