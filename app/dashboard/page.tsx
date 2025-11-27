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
        setErrorMsg("Erro ao carregar seu perfil.");
        setLoading(false);
        return;
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <main className="flex-1 pb-20 px-4 pt-6 max-w-3xl w-full mx-auto">
        {/* Cabeçalho */}
        <header className="mb-6">
          <p className="text-sm text-slate-400">Dashboard</p>
          <h1 className="text-2xl font-semibold">
            Olá, <span className="text-emerald-400">{firstName}</span>
          </h1>
          {profile?.plan === "coach" && (
            <span className="inline-flex mt-2 items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              Coach
            </span>
          )}
        </header>

        {/* Mensagens de loading/erro */}
        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            Carregando seus dados...
          </div>
        )}

        {errorMsg && !loading && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200 mb-4">
            {errorMsg}
          </div>
        )}

        {/* Conteúdo principal */}
        {!loading && !errorMsg && (
          <div className="space-y-6">
            {/* Seus números */}
            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3">
                <p className="text-xs text-slate-400">Minutos totais</p>
                <p className="mt-1 text-2xl font-semibold">{totalMinutes}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Desde o início (sem caminhada)
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3">
                <p className="text-xs text-slate-400">Pontos</p>
                <p className="mt-1 text-2xl font-semibold">{totalPoints}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  1 ponto = 1 minuto
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3">
                <p className="text-xs text-slate-400">Últimos 7 dias</p>
                <p className="mt-1 text-xl font-semibold">
                  {last7DaysMinutes} min
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3">
                <p className="text-xs text-slate-400">Últimos 30 dias</p>
                <p className="mt-1 text-xl font-semibold">
                  {last30DaysMinutes} min
                </p>
              </div>
            </section>

            {/* Desafio + grupo */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-sm font-semibold text-slate-100">
                  Desafio ativo
                </h2>
              </div>

              {activeChallenge ? (
                <>
                  <p className="text-sm font-medium text-emerald-300">
                    {activeChallenge.title}
                  </p>
                  {activeChallenge.description && (
                    <p className="mt-1 text-xs text-slate-400">
                      {activeChallenge.description}
                    </p>
                  )}

                  {groupStats && (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-slate-950/60 px-3 py-2 border border-slate-800/60">
                        <p className="text-slate-400 text-[11px]">
                          Seus minutos no desafio
                        </p>
                        <p className="mt-1 text-lg font-semibold text-emerald-300">
                          {groupStats.userMinutesInChallenge} min
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950/60 px-3 py-2 border border-slate-800/60">
                        <p className="text-slate-400 text-[11px]">
                          Média do grupo
                        </p>
                        <p className="mt-1 text-lg font-semibold text-sky-300">
                          {groupStats.challengeAverageMinutes} min
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950/60 px-3 py-2 border border-slate-800/60 col-span-2">
                        <p className="text-slate-400 text-[11px]">
                          Participantes
                        </p>
                        <p className="mt-1 text-base font-medium text-slate-100">
                          {groupStats.participants} atleta
                          {groupStats.participants === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400">
                  Nenhum desafio ativo no momento. Em breve você verá aqui os
                  desafios em que estiver participando.
                </p>
              )}
            </section>

            {/* Últimas atividades */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-100">
                  Últimas atividades
                </h2>
              </div>

              {activities.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Ainda não há atividades registradas. Conecte seu Strava e
                  volte aqui depois dos primeiros treinos.
                </p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activities.slice(0, 10).map((a) => {
                    const date = new Date(a.start_date);
                    const dateLabel = date.toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "2-digit",
                    });

                    return (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-xl bg-slate-950/70 border border-slate-800/60 px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-medium text-slate-100">
                            {a.type}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {dateLabel}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-300">
                            {a.minutes} min
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {a.points} pts
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>

      <BottomNavbar />
    </div>
  );
}
