// app/performance/page.tsx
import DashboardClient from "@/components/DashboardClient";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function PerformancePage() {
  const supabase = await supabaseServer();

  // garante login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // busca atividades do usuário (ou grupo)
  const { data: activities } = await supabase
    .from("strava_activities")
    .select("*")
    .order("start_date", { ascending: false })
    .limit(500);

  // resumo de eventos
  const { count: availableEvents } = await supabase
    .from("events")
    .select("*", { head: true, count: "exact" });

  const { count: userEvents } = await supabase
    .from("event_registrations")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", user.id);

  return (
    <main
      style={{
        padding: 16,
        paddingBottom: 80,
      }}
    >
      <DashboardClient
        activities={activities ?? []}
        eventsSummary={{
          availableEvents: availableEvents ?? 0,
          userEvents: userEvents ?? 0,
        }}
      />
    </main>
  );
}
