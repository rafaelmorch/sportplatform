/**
 * PLATFORM SPORTS
 * Arquivo: app/performance/page.tsx
 * Última alteração: 2026-08-21 18:44 ET
 *
 * Função:
 * Exibir performance usando a fonte consolidada imported_activities
 * do usuário autenticado.
 *
 * Backup anterior:
 * Backups/performance/page-BACKUP-2026-08-21-1844.txt
 */

"use client";

import { useEffect, useState } from "react";
import DashboardClient from "@/components/DashboardClient";
import { supabaseBrowser } from "@/lib/supabase-browser";

type GroupActivity = {
  id: string;
  user_id: string;
  user_name?: string;
  name: string | null;
  type: string | null;
  sport_type: string | null;
  start_date: string | null;
  distance: number | null;
  moving_time: number | null;
  total_elevation_gain: number | null;
};

export default function PerformancePage() {
  const [activities, setActivities] = useState<GroupActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        if (!user) return;

        const { data, error } = await supabaseBrowser
          .from("imported_activities")
          .select(
            "id,user_id,name,sport_type,start_date,distance_m,moving_time_s,elev_gain_m"
          )
          .eq("user_id", user.id)
          .order("start_date", { ascending: false })
          .limit(500);

        if (error) {
          console.error("Erro ao carregar performance:", error);
          return;
        }

        const mapped: GroupActivity[] = (data ?? []).map((row) => ({
          id: row.id,
          user_id: row.user_id,
          name: row.name ?? null,
          type: row.sport_type ?? null,
          sport_type: row.sport_type ?? null,
          start_date: row.start_date ?? null,
          distance:
            row.distance_m != null ? Number(row.distance_m) : null,
          moving_time:
            row.moving_time_s != null ? Number(row.moving_time_s) : null,
          total_elevation_gain:
            row.elev_gain_m != null ? Number(row.elev_gain_m) : null,
        }));

        setActivities(mapped);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <main style={{ padding: 16 }}>Carregando...</main>;
  }

  return (
    <main style={{ padding: 16, paddingBottom: 80 }}>
      <DashboardClient
        activities={activities}
        eventsSummary={{
          availableEvents: 0,
          userEvents: 0,
        }}
      />
    </main>
  );
}
