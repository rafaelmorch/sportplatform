"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DashboardCharts from "@/components/DashboardCharts";
import { supabaseBrowser } from "@/lib/supabase-browser";

const supabase = supabaseBrowser;

/* =========================
   TIPOS
========================= */

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

type RangeKey = "all" | "today" | "7d" | "30d" | "6m";

type DashboardClientProps = {
  activities: StravaActivity[];
  eventsSummary: EventsSummary;
};

type RankingEntry = {
  athleteId: number;
  label: string;
  totalPoints: number;
  totalHours: number;
  isCurrent: boolean;
};

type GroupOption = {
  id: string;
  name: string;
};

export type EvolutionPoint = {
  date: string;
  label: string;
  userMinutes: number;
  groupAvgMinutes: number;
  leaderMinutes: number;
};

/* =========================
   CONSTANTES
========================= */

const AUTO_SYNC_KEY = "sp_autosync_ran_at";
const AUTO_SYNC_COOLDOWN_MS = 10 * 60 * 1000;

/* =========================
   HELPERS
========================= */

function isInRange(dateStr: string | null, range: RangeKey, now: Date): boolean {
  if (range === "all") return true;
  if (!dateStr) return false;

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;

  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const day = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );

  const diffDays = (today.getTime() - day.getTime()) / 86400000;

  if (range === "today") return diffDays === 0;
  if (range === "7d") return diffDays <= 6;
  if (range === "30d") return diffDays <= 29;
  if (range === "6m") return diffDays <= 179;

  return true;
}

function isWalkingType(type: string | null | undefined): boolean {
  const t = (type ?? "").toLowerCase();
  return t.includes("walk") || t.includes("hike") || t.includes("caminhada");
}

function getStravaActivityPoints(
  type: string | null,
  movingSeconds: number
): number {
  if (!movingSeconds || movingSeconds <= 0) return 0;
  const hours = movingSeconds / 3600;
  const rate = isWalkingType(type) ? 15 : 100;
  return hours * rate;
}

/* =========================
   COMPONENTE
========================= */

export default function DashboardClient({
  activities,
  eventsSummary,
}: DashboardClientProps) {
  const now = new Date();

  const [range, setRange] = useState<RangeKey>("7d");

  const [currentAthleteId, setCurrentAthleteId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupAthleteIds, setGroupAthleteIds] = useState<number[]>([]);

  const [athleteNames, setAthleteNames] = useState<Record<number, string>>({});

  const [syncing, setSyncing] = useState(false);
  const autoSyncRanRef = useRef(false);

  const safeActivities = Array.isArray(activities) ? activities : [];

  /* =========================
     LOAD USER + GROUPS
  ========================= */

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      setCurrentUserId(data.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.full_name) setAthleteName(profile.full_name);

      const { data: token } = await supabase
        .from("strava_tokens")
        .select("athlete_id")
        .eq("user_id", data.user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (token?.athlete_id) setCurrentAthleteId(token.athlete_id);

      const { data: memberRows } = await supabase
        .from("training_group_members")
        .select("group_id")
        .eq("user_id", data.user.id);

      if (!memberRows || memberRows.length === 0) return;

      const groupIds = memberRows.map((m: any) => m.group_id);

      const { data: groupRows } = await supabase
        .from("training_groups")
        .select("id, title")
        .in("id", groupIds);

      if (!groupRows || groupRows.length === 0) return;

      const opts = groupRows.map((g: any) => ({
        id: g.id,
        name: g.title,
      }));

      setGroups(opts);
      setSelectedGroupId(opts[0].id);
    };

    loadUser();
  }, []);

  /* =========================
     LOAD GROUP ATHLETES
  ========================= */

  useEffect(() => {
    const loadGroupAthletes = async () => {
      if (!selectedGroupId) return;

      const { data } = await supabase
        .from("training_group_strava_athletes")
        .select("athlete_id")
        .eq("group_id", selectedGroupId);

      if (!data) return;

      setGroupAthleteIds(data.map((r: any) => r.athlete_id));
    };

    loadGroupAthletes();
  }, [selectedGroupId]);

  /* =========================
     LOAD ATHLETE NAMES (RPC)
  ========================= */

  useEffect(() => {
    const loadNames = async () => {
      if (!selectedGroupId) return;

      const { data, error } = await supabase.rpc(
        "get_group_athlete_names",
        { p_group_id: selectedGroupId }
      );

      if (error || !data) return;

      const map: Record<number, string> = {};
      data.forEach((r: any) => {
        if (r.athlete_id && r.full_name) {
          map[r.athlete_id] = r.full_name;
        }
      });

      if (currentAthleteId && athleteName) {
        map[currentAthleteId] = athleteName;
      }

      setAthleteNames(map);
    };

    loadNames();
  }, [selectedGroupId, currentAthleteId, athleteName]);

  /* =========================
     FILTER ACTIVITIES
  ========================= */

  const activitiesInRange = safeActivities.filter((a) =>
    isInRange(a.start_date, range, now)
  );

  const groupActivities = activitiesInRange.filter((a) =>
    groupAthleteIds.includes(a.athlete_id)
  );

  /* =========================
     RANKING
  ========================= */

  const ranking: RankingEntry[] = useMemo(() => {
    const map = new Map<number, { points: number; hours: number }>();

    groupActivities.forEach((a) => {
      const secs = a.moving_time ?? 0;
      if (secs <= 0) return;

      const pts = getStravaActivityPoints(a.type, secs);
      const hours = secs / 3600;

      const prev = map.get(a.athlete_id) ?? { points: 0, hours: 0 };
      map.set(a.athlete_id, {
        points: prev.points + pts,
        hours: prev.hours + hours,
      });
    });

    return Array.from(map.entries())
      .map(([athleteId, v]) => ({
        athleteId,
        label: athleteNames[athleteId] ?? `Atleta ${athleteId}`,
        totalPoints: Math.round(v.points),
        totalHours: v.hours,
        isCurrent: athleteId === currentAthleteId,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [groupActivities, athleteNames, currentAthleteId]);

  /* =========================
     EVOLUTION (FIXED)
  ========================= */

  const evolutionData: EvolutionPoint[] = useMemo(() => {
    if (!groupActivities.length) return [];

    const leaderId = ranking[0]?.athleteId ?? null;

    const userMap = new Map<string, number>();
    const leaderMap = new Map<string, number>();
    const groupMap = new Map<string, { total: number; athletes: Set<number> }>();

    groupActivities.forEach((a) => {
      if (!a.start_date) return;
      const d = new Date(a.start_date);
      const key = d.toISOString().slice(0, 10);
      const min = (a.moving_time ?? 0) / 60;

      if (!groupMap.has(key))
        groupMap.set(key, { total: 0, athletes: new Set() });

      const g = groupMap.get(key)!;
      g.total += min;
      g.athletes.add(a.athlete_id);

      if (a.athlete_id === currentAthleteId)
        userMap.set(key, (userMap.get(key) ?? 0) + min);

      if (a.athlete_id === leaderId)
        leaderMap.set(key, (leaderMap.get(key) ?? 0) + min);
    });

    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const start = new Date(end);

    if (range === "7d") start.setUTCDate(end.getUTCDate() - 6);
    if (range === "30d") start.setUTCDate(end.getUTCDate() - 29);
    if (range === "6m") start.setUTCDate(end.getUTCDate() - 179);

    const keys: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return keys.map((key) => {
      const d = new Date(key + "T00:00:00Z");
      const label = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

      const group = groupMap.get(key);
      return {
        date: key,
        label,
        userMinutes: Number((userMap.get(key) ?? 0).toFixed(1)),
        leaderMinutes: Number((leaderMap.get(key) ?? 0).toFixed(1)),
        groupAvgMinutes: Number(
          group && group.athletes.size
            ? (group.total / group.athletes.size).toFixed(1)
            : 0
        ),
      };
    });
  }, [groupActivities, ranking, range, currentAthleteId, now]);

  /* =========================
     RENDER
  ========================= */

  return (
    <DashboardCharts evolutionData={evolutionData} />
  );
}
