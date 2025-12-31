"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DashboardCharts from "@/components/DashboardCharts";
import { supabaseBrowser } from "@/lib/supabase-browser";

const supabase = supabaseBrowser;

type StravaActivity = {
  id: string | number;
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

// ---------------------
// helpers
// ---------------------
const AUTO_SYNC_KEY = "sp_autosync_ran_at";
const AUTO_SYNC_COOLDOWN_MS = 10 * 60 * 1000;

function metersToKm(distance: number | null | undefined): number {
  if (!distance || distance <= 0) return 0;
  return distance / 1000;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "0:00:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
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

function getRangeCutoff(range: RangeKey, now: Date): string | null {
  if (range === "all") return null;
  const d = new Date(now);
  if (range === "today") {
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range === "7d") d.setDate(d.getDate() - 7);
  if (range === "30d") d.setDate(d.getDate() - 30);
  if (range === "6m") d.setDate(d.getDate() - 180);
  return d.toISOString();
}

// ---------------------
// component
// ---------------------
export default function DashboardClient({
  activities,
  eventsSummary,
}: DashboardClientProps) {
  const [range, setRange] = useState<RangeKey>("30d");

  const [currentAthleteId, setCurrentAthleteId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupAthleteIds, setGroupAthleteIds] = useState<number[] | null>(null);

  const [fetchedActivities, setFetchedActivities] =
    useState<StravaActivity[] | null>(null);

  const autoSyncRanRef = useRef(false);

  // ---------------------
  // load user / athlete
  // ---------------------
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCurrentAthleteId(activities?.[0]?.athlete_id ?? null);
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) setAthleteName(profile.full_name);

      const { data: token } = await supabase
        .from("strava_tokens")
        .select("athlete_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setCurrentAthleteId(token?.athlete_id ?? null);

      // grupos do usuário
      const { data: memberRows } = await supabase
        .from("training_group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memberRows && memberRows.length > 0) {
        const ids = memberRows.map((m: any) => m.group_id);
        const { data: groupRows } = await supabase
          .from("training_groups")
          .select("id, title")
          .in("id", ids);

        if (groupRows) {
          const opts = groupRows.map((g: any) => ({
            id: g.id,
            name: g.title,
          }));
          setGroups(opts);
          setSelectedGroupId(opts[0]?.id ?? null);
        }
      }
    };

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------
  // load athletes of group
  // ---------------------
  useEffect(() => {
    const loadGroupAthletes = async () => {
      if (!selectedGroupId) {
        setGroupAthleteIds(null);
        return;
      }

      const { data } = await supabase
        .from("training_group_strava_athletes")
        .select("athlete_id")
        .eq("group_id", selectedGroupId);

      const ids = Array.from(
        new Set(
          (data ?? [])
            .map((r: any) => r.athlete_id)
            .filter((x: any) => typeof x === "number")
        )
      );
      setGroupAthleteIds(ids);
    };

    loadGroupAthletes();
  }, [selectedGroupId]);

  // ---------------------
  // fetch activities (FIX DO "TUDO")
  // ---------------------
  useEffect(() => {
    const fetchActivities = async () => {
      if (!groupAthleteIds) {
        setFetchedActivities(null);
        return;
      }
      if (groupAthleteIds.length === 0) {
        setFetchedActivities([]);
        return;
      }

      const cutoff = getRangeCutoff(range, new Date());

      let q = supabase
        .from("strava_activities")
        .select(
          "id, athlete_id, name, type, sport_type, start_date, distance, moving_time, total_elevation_gain"
        )
        .in("athlete_id", groupAthleteIds)
        .not("moving_time", "is", null);

      if (cutoff) q = q.gte("start_date", cutoff);

      const { data } = await q
        .order("start_date", { ascending: false })
        .limit(10000);

      setFetchedActivities((data ?? []) as StravaActivity[]);
    };

    fetchActivities();
  }, [groupAthleteIds, range]);

  const baseActivities = fetchedActivities ?? activities ?? [];

  const groupActivities =
    groupAthleteIds && groupAthleteIds.length > 0
      ? baseActivities.filter((a) =>
          groupAthleteIds.includes(a.athlete_id)
        )
      : [];

  const athleteActivities =
    currentAthleteId != null
      ? groupActivities.filter((a) => a.athlete_id === currentAthleteId)
      : [];

  // ---------------------
  // ranking
  // ---------------------
  const ranking: RankingEntry[] = useMemo(() => {
    const map = new Map<number, { points: number; hours: number }>();

    for (const a of groupActivities) {
      const secs = a.moving_time ?? 0;
      if (!secs) continue;
      const pts = getStravaActivityPoints(a.type ?? a.sport_type ?? null, secs);
      const hours = secs / 3600;
      const prev = map.get(a.athlete_id) ?? { points: 0, hours: 0 };
      map.set(a.athlete_id, {
        points: prev.points + pts,
        hours: prev.hours + hours,
      });
    }

    return Array.from(map.entries())
      .map(([athleteId, v]) => ({
        athleteId,
        label:
          currentAthleteId === athleteId && athleteName
            ? athleteName
            : `Atleta ${athleteId}`,
        totalPoints: Math.round(v.points),
        totalHours: v.hours,
        isCurrent: currentAthleteId === athleteId,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [groupActivities, currentAthleteId, athleteName]);

  // ---------------------
  // evolution data
  // ---------------------
  const evolutionData: EvolutionPoint[] = useMemo(() => {
    if (groupActivities.length === 0) return [];

    const leaderAthleteId = ranking[0]?.athleteId ?? null;

    const userMap = new Map<string, number>();
    const leaderMap = new Map<string, number>();
    const groupMap = new Map<
      string,
      { totalMinutes: number; athleteIds: Set<number> }
    >();

    for (const a of groupActivities) {
      if (!a.start_date) continue;
      const d = new Date(a.start_date);
      const key = d.toISOString().slice(0, 10);
      const minutes = (a.moving_time ?? 0) / 60;

      const g = groupMap.get(key) ?? {
        totalMinutes: 0,
        athleteIds: new Set<number>(),
      };
      g.totalMinutes += minutes;
      g.athleteIds.add(a.athlete_id);
      groupMap.set(key, g);

      if (a.athlete_id === currentAthleteId)
        userMap.set(key, (userMap.get(key) ?? 0) + minutes);

      if (a.athlete_id === leaderAthleteId)
        leaderMap.set(key, (leaderMap.get(key) ?? 0) + minutes);
    }

    return Array.from(groupMap.keys())
      .sort()
      .map((key) => {
        const d = new Date(key);
        const label = d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        const group = groupMap.get(key)!;
        return {
          date: key,
          label,
          userMinutes: Number((userMap.get(key) ?? 0).toFixed(1)),
          leaderMinutes: Number((leaderMap.get(key) ?? 0).toFixed(1)),
          groupAvgMinutes: Number(
            (group.totalMinutes / group.athleteIds.size).toFixed(1)
          ),
        };
      });
  }, [groupActivities, ranking, currentAthleteId]);

  // ---------------------
  // render
  // ---------------------
  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      {/* GRÁFICOS */}
      <section style={{ marginBottom: 18 }}>
        <DashboardCharts evolutionData={evolutionData} />
      </section>
    </div>
  );
}
