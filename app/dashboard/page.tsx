// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase-browser";
import DashboardClient from "@/components/DashboardClient";
import BottomNavbar from "@/components/BottomNavbar";

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

export default function DashboardPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [eventsSummary, setEventsSummary] = useState<EventsSummary>({
    availableEvents: 0,
    userEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser;

    const load = async () => {
      setLoading(true);
      setErrorMsg(null);

      // 1) sessão
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        setErrorMsg("Não foi possível carregar seus dados. Faça login novamente.");
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      // 2) ATIVIDADES: agora é 100% STRAVA (direto da strava_activities)
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
        .limit(2000);

      if (activitiesError) {
        console.error("Erro ao carregar strava_activities:", activitiesError);
        setErrorMsg("Erro ao carregar atividades do Strava.");
        setLoading(false);
        return;
      }

      setActivities((activitiesData ?? []) as StravaActivity[]);

      // 3) resumo de eventos (mantém como está)
      try {
        const { count: availableEvents } = await supabase
          .from("events")
          .select("*", { head: true, count: "exact" });

        const { count: userEvents } = await supabase
          .from("event_registrations")
          .select("*", { head: true, count: "exact" })
          .eq("user_id", userId);

        setEventsSummary({
          availableEvents: availableEvents ?? 0,
          userEvents: userEvents ?? 0,
        });
      } catch (e) {
        console.warn("Erro ao carregar resumo de eventos:", e);
        setEventsSummary({
          availableEvents: 0,
          userEvents: 0,
        });
      }

      setLoading(false);
    };

    load();
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#020617",
        color: "#e5e7eb",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <main
        style={{
          flex: 1,
          padding: "16px 12px 80px",
          width: "100%",
          boxSizing: "border-box",
          margin: "0 auto",
        }}
      >
        {loading && !errorMsg && (
          <p style={{ fontSize: 13 }}>Carregando seu dashboard...</p>
        )}

        {errorMsg && (
          <p style={{ fontSize: 13, color: "#fca5a5" }}>{errorMsg}</p>
        )}

        {!loading && !errorMsg && (
          <DashboardClient activities={activities} eventsSummary={eventsSummary} />
        )}
      </main>

      <BottomNavbar />
    </div>
  );
}
