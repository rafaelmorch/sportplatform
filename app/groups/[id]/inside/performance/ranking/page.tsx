import BackArrow from "@/components/BackArrow";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type GroupActivity = {
  user_id: string;
  sport_type: string | null;
  moving_time_s: number | null;
};

function isWalkingType(type: string | null) {
  const value = (type ?? "").toLowerCase();
  return value.includes("walk") || value.includes("walking") || value.includes("hike");
}

function getPoints(type: string | null, movingSeconds: number) {
  if (!movingSeconds || movingSeconds <= 0) return 0;

  const hours = movingSeconds / 3600;
  const rate = isWalkingType(type) ? 15 : 100;

  return hours * rate;
}

export default async function RankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: communityId } = await params;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: memberRows } = await supabase
    .from("app_membership_requests")
    .select("user_id")
    .eq("community_id", communityId)
    .in("status", ["approved", "active"]);

  const userIds = Array.from(
    new Set(
      (memberRows ?? [])
        .map((row) => row.user_id)
        .filter((id): id is string => typeof id === "string")
    )
  );

  const { data: profileRows } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", userIds)
    : { data: [] };

  const userNames = new Map<string, string>();

  (profileRows ?? []).forEach((profile) => {
    if (profile.id && profile.full_name) {
      userNames.set(profile.id, profile.full_name);
    }
  });

  const { data } = userIds.length
    ? await supabase
        .from("imported_activities")
        .select("user_id,sport_type,moving_time_s")
        .in("user_id", userIds)
        .limit(5000)
    : { data: [] };

  const activities = (data ?? []) as GroupActivity[];

  const rankingMap = new Map<
    string,
    {
      points: number;
      hours: number;
    }
  >();

  for (const activity of activities) {
    const seconds = activity.moving_time_s ?? 0;

    if (seconds <= 0) continue;

    const previous = rankingMap.get(activity.user_id) ?? {
      points: 0,
      hours: 0,
    };

    rankingMap.set(activity.user_id, {
      points:
        previous.points +
        getPoints(activity.sport_type ?? null, seconds),
      hours: previous.hours + seconds / 3600,
    });
  }

  const ranking = Array.from(rankingMap.entries())
    .map(([userId, values]) => ({
      userId,
      name: userNames.get(userId) ?? "Atleta",
      points: Math.round(values.points),
      hours: values.hours,
    }))
    .sort((a, b) => b.points - a.points);
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "20px 12px 80px",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <BackArrow href={`/groups/${communityId}/inside/performance`} />
        </div>

        <div style={{ marginBottom: 22 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#0f172a",
            }}
          >
            Ranking completo
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Classificação dos atletas do grupo baseada nas atividades Strava.
          </p>
        </div>

        <div
          style={{
            marginBottom: 16,
            padding: 12,
            border: "1px solid #f59e0b",
            borderRadius: 12,
            background: "#fffbeb",
            color: "#92400e",
            fontSize: 12,
            fontFamily: "Montserrat, sans-serif",
          }}
        >
        </div>
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "48px minmax(100px, 1fr) 72px 80px",
              gap: 8,
              padding: "12px 14px",
              borderBottom: "1px solid #e2e8f0",
              fontSize: 11,
              fontWeight: 500,
              color: "#64748b",
            }}
          >
            <div>Pos.</div>
            <div>Atleta</div>
            <div style={{ textAlign: "right" }}>Pontos</div>
            <div style={{ textAlign: "right" }}>Horas</div>
          </div>

          {ranking.length === 0 ? (
            <div
              style={{
                padding: 18,
                fontSize: 13,
                color: "#64748b",
              }}
            >
              Ainda não há atividades suficientes para gerar o ranking.
            </div>
          ) : (
            ranking.map((athlete, index) => (
              <div
                key={athlete.userId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px minmax(100px, 1fr) 72px 80px",
                  gap: 8,
                  alignItems: "center",
                  padding: "13px 14px",
                  borderBottom:
                    index === ranking.length - 1
                      ? "none"
                      : "1px solid #eef2f7",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  #{index + 1}
                </div>

                <div
                  style={{
                    minWidth: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {athlete.name}
                </div>

                <div
                  style={{
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {athlete.points}
                </div>

                <div
                  style={{
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#475569",
                  }}
                >
                  {athlete.hours.toFixed(1)} h
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}






