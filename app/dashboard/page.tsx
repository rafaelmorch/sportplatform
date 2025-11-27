"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import BottomNavbar from "@/components/BottomNavbar";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Profile = {
  full_name: string | null;
  plan: string | null;
};

type Activity = {
  id: number;
  type: string;
  minutes: number;
  points: number;
  start_date: string;
};

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
};

type GroupStats = {
  participants: number;
  challengeTotalMinutes: number;
  challengeAverageMinutes: number;
  userMinutesInChallenge: number;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [last7DaysMinutes, setLast7DaysMinutes] = useState(0);
  const [last30DaysMinutes, setLast30DaysMinutes] = useState(0);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(
    null
  );
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setErrorMsg(null);

      // 1) sessão do usuário
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setErrorMsg("Não foi possível carregar seus dados. Faça login novamente.");
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // 2) profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, plan")
        .eq("id", userId)
        .single();

      if (profileError) {
        // fallback: usa e-mail como nome e plano free
        console.warn("Perfil não encontrado, usando padrão:", profileError);
        setProfile({
          full_name: session.user.email ?? "Atleta",
          plan: "free",
        });
      } else if (profileData) {
        setProfile(profileData as Profile);
      }

      // 3) atividades
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("user_activities")
        .select("id, type, minutes, points, start_date")
        .eq("user_id", userId)
        .order("start_date", { ascending: false });

      if (activitiesError) {
        console.error(activitiesError);
        setErrorMsg("Erro ao carregar atividades.");
        setLoading(false);
        return;
      }

      const acts = (activitiesData || []) as Activity[];
      setActivities(acts);

      // 3.1) stats pessoais
      let totalMin = 0;
      let totalPts = 0;
      let last7 = 0;
      let last30 = 0;

      const now = new Date();
      const msInDay = 24 * 60 * 60 * 1000;

      acts.forEach((a) => {
        totalMin += a.minutes;
        totalPts += a.points;

        const d = new Date(a.start_date);
        const diffDays = (now.getTime() - d.getTime()) / msInDay;

        if (diffDays <= 7) last7 += a.minutes;
        if (diffDays <= 30) last30 += a.minutes;
      });

      setTotalMinutes(totalMin);
      setTotalPoints(totalPts);
      setLast7DaysMinutes(last7);
      setLast30DaysMinutes(last30);

      // 4) desafio ativo
      const todayIso = new Date().toISOString().slice(0, 10);

      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select("id, title, description, start_date, end_date")
        .lte("start_date", todayIso)
        .gte("end_date", todayIso)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!challengeError && challengeData) {
        const challenge = challengeData as Challenge;
        setActiveChallenge(challenge);

        const { data: participantsData, error: participantsError } =
          await supabase
            .from("challenge_participants")
            .select("user_id")
            .eq("challenge_id", challenge.id);

        if (!participantsError && participantsData) {
          const participants = participantsData || [];
          const participantIds = participants.map((p: any) => p.user_id);

          if (participantIds.length > 0) {
            const {
              data: challengeActivities,
              error: challengeActivitiesError,
            } = await supabase
              .from("user_activities")
              .select("user_id, minutes, start_date")
              .in("user_id", participantIds)
              .gte("start_date", challenge.start_date)
              .lte("start_date", challenge.end_date);

            if (!challengeActivitiesError && challengeActivities) {
              const byUser: Record<string, number> = {};
              let totalChallengeMinutes = 0;

              (challengeActivities || []).forEach((a: any) => {
                const uid = a.user_id as string;
                const mins = a.minutes as number;
                byUser[uid] = (byUser[uid] || 0) + mins;
                totalChallengeMinutes += mins;
              });

              const participantsCount = participantIds.length;
              const avg =
                participantsCount > 0
                  ? Math.round(totalChallengeMinutes / participantsCount)
                  : 0;

              const userMinutesInChallenge = byUser[userId] || 0;

              setGroupStats({
                participants: participantsCount,
                challengeTotalMinutes: totalChallengeMinutes,
                challengeAverageMinutes: avg,
                userMinutesInChallenge,
              });
            }
          } else {
            setGroupStats({
              participants: 0,
              challengeTotalMinutes: 0,
              challengeAverageMinutes: 0,
              userMinutesInChallenge: 0,
            });
          }
        }
      }

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const firstName = profile?.full_name
    ? profile.full_name.split(" ")[0]
    : "Atleta";

  // ---------- estilos básicos ----------
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#020617",
    color: "#e5e7eb",
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    padding: "16px 16px 80px",
    maxWidth: 960,
    margin: "0 auto",
  };

  const sectionGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 20,
  };

  const cardStyle: React.CSSProperties = {
    borderRadius: 18,
    padding: "12px 14px",
    background:
      "radial-gradient(circle at top, rgba(15,23,42,0.95), rgba(15,23,42,0.9))",
    border: "1px solid rgba(30,64,175,0.6)",
  };

  const smallLabel: React.CSSProperties = {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
  };

  const bigNumber: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
  };

  return (
    <div style={pageStyle}>
      <main style={mainStyle}>
        {/* Cabeçalho */}
        <header style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 11,
              color: "#64748b",
              marginBottom: 2,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
            }}
          >
            Dashboard
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Olá,{" "}
              <span style={{ color: "#4ade80" }}>
                {firstName || "Atleta"}
              </span>
            </h1>
            {profile?.plan === "coach" && (
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 999,
                  border: "1px solid rgba(74,222,128,0.6)",
                  background: "rgba(22,163,74,0.15)",
                  color: "#bbf7d0",
                }}
              >
                Coach
              </span>
            )}
          </div>
        </header>

        {/* Mensagens de loading/erro */}
        {loading && (
          <div
            style={{
              ...cardStyle,
              background:
                "radial-gradient(circle at top, #0f172a, #020617 70%)",
              border: "1px solid rgba(148,163,184,0.4)",
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 13, margin: 0 }}>Carregando seus dados...</p>
          </div>
        )}

        {errorMsg && !loading && (
          <div
            style={{
              ...cardStyle,
              background:
                "radial-gradient(circle at top, rgba(127,29,29,0.9), #111827 80%)",
              border: "1px solid rgba(248,113,113,0.7)",
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 13, margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {/* Conteúdo principal */}
        {!loading && !errorMsg && (
          <>
            {/* Seus números */}
            <section style={sectionGridStyle}>
              <div style={cardStyle}>
                <p style={smallLabel}>Minutos totais</p>
                <p style={bigNumber}>{totalMinutes}</p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Desde o início (sem caminhada)
                </p>
              </div>

              <div style={cardStyle}>
                <p style={smallLabel}>Pontos</p>
                <p style={bigNumber}>{totalPoints}</p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  1 ponto = 1 minuto
                </p>
              </div>

              <div style={cardStyle}>
                <p style={smallLabel}>Últimos 7 dias</p>
                <p style={bigNumber}>{last7DaysMinutes} min</p>
              </div>

              <div style={cardStyle}>
                <p style={smallLabel}>Últimos 30 dias</p>
                <p style={bigNumber}>{last30DaysMinutes} min</p>
              </div>
            </section>

            {/* Desafio + grupo */}
            <section
              style={{
                ...cardStyle,
                marginBottom: 20,
                background:
                  "radial-gradient(circle at top, #020617, #020617 60%, #000000 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                }}
              >
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Desafio ativo
                </h2>
              </div>

              {activeChallenge ? (
                <>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6ee7b7",
                      marginBottom: 4,
                    }}
                  >
                    {activeChallenge.title}
                  </p>
                  {activeChallenge.description && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginTop: 0,
                        marginBottom: 10,
                      }}
                    >
                      {activeChallenge.description}
                    </p>
                  )}

                  {groupStats && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                        gap: 10,
                        fontSize: 12,
                      }}
                    >
                      <div
                        style={{
                          borderRadius: 14,
                          padding: "10px 12px",
                          background: "#020617",
                          border: "1px solid rgba(34,197,94,0.5)",
                        }}
                      >
                        <p style={{ ...smallLabel, marginBottom: 2 }}>
                          Seus minutos no desafio
                        </p>
                        <p
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#4ade80",
                            margin: 0,
                          }}
                        >
                          {groupStats.userMinutesInChallenge} min
                        </p>
                      </div>

                      <div
                        style={{
                          borderRadius: 14,
                          padding: "10px 12px",
                          background: "#020617",
                          border: "1px solid rgba(59,130,246,0.6)",
                        }}
                      >
                        <p style={{ ...smallLabel, marginBottom: 2 }}>
                          Média do grupo
                        </p>
                        <p
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#93c5fd",
                            margin: 0,
                          }}
                        >
                          {groupStats.challengeAverageMinutes} min
                        </p>
                      </div>

                      <div
                        style={{
                          borderRadius: 14,
                          padding: "10px 12px",
                          background: "#020617",
                          border: "1px solid rgba(148,163,184,0.6)",
                        }}
                      >
                        <p style={{ ...smallLabel, marginBottom: 2 }}>
                          Participantes
                        </p>
                        <p
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          {groupStats.participants} atleta
                          {groupStats.participants === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                  Nenhum desafio ativo no momento. Em breve você verá aqui os
                  desafios em que estiver participando.
                </p>
              )}
            </section>

            {/* Últimas atividades */}
            <section
              style={{
                ...cardStyle,
                marginBottom: 24,
                background:
                  "radial-gradient(circle at top left, #020617, #020617 60%, #000000 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 10,
                }}
              >
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Últimas atividades
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  {activities.length === 0
                    ? "Sem atividades registradas"
                    : "As 10 atividades mais recentes"}
                </span>
              </div>

              {activities.length === 0 ? (
                <p style={{ fontSize: 12, color: "#9ca3af" }}>
                  Ainda não há atividades registradas. Conecte seu Strava e
                  volte aqui depois dos primeiros treinos.
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    maxHeight: 260,
                    overflowY: "auto",
                  }}
                >
                  {activities.slice(0, 10).map((a) => {
                    const d = new Date(a.start_date);
                    const dateLabel = d.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    });

                    return (
                      <li
                        key={a.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 4px",
                          borderTop: "1px solid rgba(31,41,55,0.8)",
                          fontSize: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {a.type}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#9ca3af",
                            }}
                          >
                            {dateLabel}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#4ade80",
                            }}
                          >
                            {a.minutes} min
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#9ca3af",
                            }}
                          >
                            {a.points} pts
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <BottomNavbar />
    </div>
  );
}
