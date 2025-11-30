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

      // 2) grupos do usuário -> membros -> athlete_ids -> atividades
      const {
        data: myMemberships,
        error: membershipsError,
      } = await supabase
        .from("training_group_members")
        .select("group_id")
        .eq("user_id", userId);

      if (membershipsError) {
        console.error("Erro ao carregar groups do usuário:", membershipsError);
        setErrorMsg("Erro ao carregar seus grupos.");
        setLoading(false);
        return;
      }

      const groupIds = Array.from(
        new Set((myMemberships ?? []).map((m: any) => m.group_id as string))
      );

      if (groupIds.length === 0) {
        setActivities([]);
        setEventsSummary({
          availableEvents: 0,
          userEvents: 0,
        });
        setLoading(false);
        return;
      }

      const {
        data: allMembers,
        error: allMembersError,
      } = await supabase
        .from("training_group_members")
        .select("user_id")
        .in("group_id", groupIds);

      if (allMembersError) {
        console.error("Erro ao carregar membros dos grupos:", allMembersError);
        setErrorMsg("Erro ao carregar membros dos seus grupos.");
        setLoading(false);
        return;
      }

      const userIds = Array.from(
        new Set((allMembers ?? []).map((m: any) => m.user_id as string))
      );

      if (userIds.length === 0) {
        setActivities([]);
        setEventsSummary({
          availableEvents: 0,
          userEvents: 0,
        });
        setLoading(false);
        return;
      }

      const {
        data: tokens,
        error: tokensError,
      } = await supabase
        .from("strava_tokens")
        .select("athlete_id")
        .in("user_id", userIds);

      if (tokensError) {
        console.error("Erro ao carregar tokens Strava dos membros:", tokensError);
        setErrorMsg("Erro ao carregar dados de atividades dos grupos.");
        setLoading(false);
        return;
      }

      const athleteIds = Array.from(
        new Set(
          (tokens ?? [])
            .map((t: any) => t.athlete_id as number | null)
            .filter((id): id is number => id != null)
        )
      );

      if (athleteIds.length === 0) {
        setActivities([]);
        setEventsSummary({
          availableEvents: 0,
          userEvents: 0,
        });
        setLoading(false);
        return;
      }

      const {
        data: activitiesData,
        error: activitiesError,
      } = await supabase
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
        console.error("Erro ao carregar atividades:", activitiesError);
        setErrorMsg("Erro ao carregar atividades.");
        setLoading(false);
        return;
      }

      setActivities((activitiesData ?? []) as StravaActivity[]);

      // 3) resumo de eventos
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
        width: "100%",        // <--- aqui
        maxWidth: "100%",     // <--- aqui
        boxSizing: "border-box",
        overflowX: "hidden",  // garante que nada vaze
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
          <DashboardClient
            activities={activities}
            eventsSummary={eventsSummary}
          />
        )}
      </main>

      <BottomNavbar />
    </div>
  );
}
