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

      // -------------------------------------------------
      // 2) Descobrir todos os athletes dos grupos do usuário
      // -------------------------------------------------

      // 2.1) grupos em que o usuário participa
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
        // não está em nenhum grupo → dashboard fica vazio
        setActivities([]);
        setEventsSummary({
          availableEvents: 0,
          userEvents: 0,
        });
        setLoading(false);
        return;
      }

      // 2.2) todos os usuários que participam desses grupos
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

      // 2.3) athlete_ids Strava desses usuários
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
        // ninguém com Strava conectado
        setActivities([]);
        setEventsSummary({
          availableEvents: 0,
          userEvents: 0,
        });
        setLoading(false);
        return;
      }

      // -------------------------------------------------
      // 3) Atividades Strava de TODOS os athletes dos grupos
      // -------------------------------------------------
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

      // -------------------------------------------------
      // 4) Resumo de eventos (mantido igual)
      // -------------------------------------------------
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
