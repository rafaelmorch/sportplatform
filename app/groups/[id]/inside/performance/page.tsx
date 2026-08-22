/**
 * PLATFORM SPORTS
 * Arquivo: app/groups/[id]/inside/performance/page.tsx
 * Última alteração: 2026-08-21 20:19 ET
 *
 * Função:
 * Exibir a performance consolidada do grupo.
 *
 * Dados:
 * Busca via /api/groups/[id]/performance usando a sessão autenticada.
 *
 * Regras:
 * - Membros approved ou active.
 * - Atividades apenas a partir da entrada no grupo.
 * - Fonte consolidada imported_activities.
 *
 * Backup anterior:
 * Backups/groups/performance-page-BACKUP-2026-08-21-2019.txt
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";
import BackArrow from "@/components/BackArrow";
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

export default function GroupPerformancePage() {
  const params = useParams<{ id: string }>();
  const communityId = params?.id;

  const [activities, setActivities] =
    useState<GroupActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadPerformance() {
      try {
        setLoading(true);
        setErrorText(null);

        const {
          data: sessionData,
          error: sessionError,
        } = await supabaseBrowser.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const accessToken =
          sessionData.session?.access_token;

        if (!accessToken) {
          throw new Error(
            "Sessão não encontrada. Faça login novamente."
          );
        }

        const response = await fetch(
          `/api/groups/${communityId}/performance`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ??
              `Erro HTTP ${response.status}`
          );
        }

        setActivities(
          Array.isArray(result.activities)
            ? result.activities
            : []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar performance do grupo:",
          error
        );

        setErrorText(
          error instanceof Error
            ? error.message
            : "Erro ao carregar performance do grupo."
        );
      } finally {
        setLoading(false);
      }
    }

    if (communityId) {
      loadPerformance();
    }
  }, [communityId]);

  const eventsSummary = {
    availableEvents: 0,
    userEvents: 0,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "20px 10px 80px",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <BackArrow
          href={`/groups/${communityId}/inside`}
        />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          margin: 0,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Performance
          </h1>
        </div>

        {loading ? (
          <div>Carregando performance...</div>
        ) : errorText ? (
          <div
            style={{
              color: "#b91c1c",
              fontSize: 14,
            }}
          >
            {errorText}
          </div>
        ) : (
          <DashboardClient
            activities={activities}
            eventsSummary={eventsSummary}
            communityId={communityId}
          />
        )}
      </div>
    </main>
  );
}
