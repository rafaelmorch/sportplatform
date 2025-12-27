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

      // 2) grupos do usuário
      const { data: myMemberships, error: membershipsError } = await supabase
        .from("training_group_members")
        .select("group_id")
        .eq("user_id", userId);

      if (membershipsError) {
        console.error("Erro ao carregar grupos do usuário:", membershipsError);
        setErrorMsg("Erro ao carregar seus grupos.");
        setLoading(false);
        return;
      }

      const groupIds = Array.from(
        new Set((myMemberships ?? []).map((m: any) => m.group_id as string))
      );

      if (groupIds.length === 0) {
        setActivities([]);
        setEventsSummary({ availableEvents: 0, userEvents: 0 });
        setLoading(false);
        return;
      }

      // 3) athlete_ids por grupo (NOVA forma): training_group_strava_athletes
      const { data: groupAthletes, error: groupAthletesError } = await supabase
        .from("training_group_strava_athletes")
        .select("athlete_id")
        .in("group_id", groupIds);

      if (groupAthletesError) {
        console.error(
          "Erro ao carregar athlete_ids dos grupos (training_group_strava_athletes):",
          groupAthletesError
        );
        setErrorMsg("Erro ao carregar atletas dos seus grupos.");
        setLoading(false);
        return;
      }

      const athleteIds = Array.from(
        new Set(
          (groupAthletes ?? [])
            .map((r: any) => r.athlete_id as number | null)
            .filter((id): id is number => typeof id === "number")
        )
      );

      if (athleteIds.length === 0) {
        setActivities([]);
        setEventsSummary({ availableEvents: 0, userEvents: 0 });
        setLoading(false);
        return;
      }

      // 4) carrega activities Strava desses atletas
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
        .in("athlete_id", athleteIds)
        .order("start_date", { ascending: false })
        .limit(2000);

      if (activitiesError) {
        console.error("Erro ao carregar strava_activities:", activitiesError);
        setErrorMsg("Erro ao carregar atividades.");
        setLoading(false);
        return;
      }

      setActivities((activitiesData ?? []) as StravaActivity[]);

      // 5) resumo de eventos (mantido)
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
        setEventsSummary({ availableEvents: 0, userEvents: 0 });
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
