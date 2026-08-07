"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

import PerformanceAiBackButton from "@/components/performance-ai/PerformanceAiBackButton";
type PerformanceAiProfile = {
  id: string;
  user_id: string;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  goal_text: string | null;
  goal_date: string | null;
  level: string | null;
  days_per_week: number | null;
  minutes_per_session: number | null;
  sports: string[] | string | null;
  health_notes: string | null;
};

function showValue(value: string | null, fallback = "Não informado") {
  return value?.trim() || fallback;
}

function formatDate(value: string | null) {
  if (!value) return "Não informada";

  const parts = value.slice(0, 10).split("-");

  if (parts.length !== 3) return value;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatGender(value: string | null) {
  if (!value) return "Não informado";

  const normalized = value.trim().toLowerCase();

  const options: Record<string, string> = {
    male: "Masculino",
    masculino: "Masculino",
    homem: "Masculino",
    female: "Feminino",
    feminino: "Feminino",
    mulher: "Feminino",
    other: "Outro",
    outro: "Outro",
  };

  return options[normalized] ?? value;
}

function formatLevel(value: string | null) {
  if (!value) return "Não informado";

  const normalized = value.trim().toLowerCase();

  const options: Record<string, string> = {
    beginner: "Iniciante",
    iniciante: "Iniciante",
    intermediate: "Intermediário",
    intermediario: "Intermediário",
    intermediário: "Intermediário",
    advanced: "Avançado",
    avancado: "Avançado",
    avançado: "Avançado",
  };

  return options[normalized] ?? value;
}

function formatGoal(value: string | null) {
  if (!value) return "Não informado";

  const normalized = value.trim().toLowerCase();

  const options: Record<string, string> = {
    performance: "Melhorar a performance",
    weight_loss: "Perder peso",
    emagrecimento: "Perder peso",
    conditioning: "Melhorar o condicionamento",
    condicionamento: "Melhorar o condicionamento",
    maintenance: "Manutenção da saúde e do desempenho",
    race: "Preparação para uma prova",
    competition: "Preparação para uma competição",
    health: "Melhorar a saúde",
  };

  return options[normalized] ?? value;
}

function formatSports(value: string[] | string | null) {
  if (!value) return "Não informadas";

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Não informadas";
  }

  const trimmed = value.trim();

  if (!trimmed) return "Não informadas";

  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed.join(", ");
    }
  } catch {
    // O valor pode estar armazenado como texto comum.
  }

  return trimmed;
}

export default function PerformanceAiProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [profile, setProfile] =
    useState<PerformanceAiProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("performance_ai_profiles")
        .select(
          "id,user_id,age,gender,height_cm,weight_kg,goal,goal_text,goal_date,level,days_per_week,minutes_per_session,sports,health_notes"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error(error);
        setErrorMessage(
          "Não foi possível carregar seu perfil neste momento."
        );
      } else {
        setProfile(
          (data as PerformanceAiProfile | null) ?? null
        );
      }

      setLoading(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <PerformanceAiBackButton />

        <div style={{ marginTop: 20 }}>
          <div style={styles.eyebrow}>PERFORMANCE AI</div>

          <h1 style={styles.title}>Meu perfil</h1>

          <p style={styles.subtitle}>
            Informações e objetivos utilizados pelo Coach IA para
            personalizar suas orientações.
          </p>
        </div>
      </header>

      {loading ? (
        <section style={styles.messageSection}>
          <strong>Carregando seu perfil...</strong>
        </section>
      ) : errorMessage ? (
        <section style={styles.messageSection}>
          <h2 style={styles.messageTitle}>
            Não foi possível carregar seu perfil
          </h2>

          <p style={styles.messageText}>{errorMessage}</p>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </section>
      ) : !profile ? (
        <section style={styles.messageSection}>
          <div style={styles.aiIcon}>AI</div>

          <h2 style={styles.messageTitle}>
            Seu perfil ainda não foi criado
          </h2>

          <p style={styles.messageText}>
            Faça a consulta inicial para contar ao Coach IA seus
            objetivos, experiência, disponibilidade e limitações.
          </p>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() =>
              router.push("/performance-ai/coach?openConversation=1")
            }
          >
            Iniciar consulta
          </button>
        </section>
      ) : (
        <>
          <ProfileSection
            eyebrow="DADOS PESSOAIS"
            title="Sobre você"
          >
            <ProfileItem
              label="Idade"
              value={
                profile.age !== null
                  ? `${profile.age} anos`
                  : "Não informada"
              }
            />

            <ProfileItem
              label="Gênero"
              value={formatGender(profile.gender)}
            />

            <ProfileItem
              label="Altura"
              value={
                profile.height_cm !== null
                  ? `${Number(profile.height_cm).toFixed(0)} cm`
                  : "Não informada"
              }
            />

            <ProfileItem
              label="Peso atual"
              value={
                profile.weight_kg !== null
                  ? `${Number(profile.weight_kg).toLocaleString(
                      "pt-BR",
                      {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      }
                    )} kg`
                  : "Não informado"
              }
              last
            />
          </ProfileSection>

          <ProfileSection
            eyebrow="OBJETIVO"
            title="Onde você quer chegar"
          >
            <ProfileItem
              label="Objetivo principal"
              value={formatGoal(profile.goal)}
            />

            <ProfileItem
              label="Meta"
              value={showValue(
                profile.goal_text,
                "Não informada"
              )}
              multiline
            />

            <ProfileItem
              label="Data da meta"
              value={formatDate(profile.goal_date)}
              last
            />
          </ProfileSection>

          <ProfileSection
            eyebrow="ROTINA ESPORTIVA"
            title="Treino e disponibilidade"
          >
            <ProfileItem
              label="Nível atual"
              value={formatLevel(profile.level)}
            />

            <ProfileItem
              label="Modalidades"
              value={formatSports(profile.sports)}
              multiline
            />

            <ProfileItem
              label="Disponibilidade"
              value={
                profile.days_per_week !== null
                  ? `${profile.days_per_week} ${
                      profile.days_per_week === 1
                        ? "dia por semana"
                        : "dias por semana"
                    }`
                  : "Não informada"
              }
            />

            <ProfileItem
              label="Tempo por treino"
              value={
                profile.minutes_per_session !== null
                  ? `${profile.minutes_per_session} minutos`
                  : "Não informado"
              }
              last
            />
          </ProfileSection>

          <ProfileSection
            eyebrow="SAÚDE"
            title="Cuidados e limitações"
          >
            <ProfileItem
              label="Informações importantes"
              value={showValue(
                profile.health_notes,
                "Nenhuma informação registrada"
              )}
              multiline
              last
            />
          </ProfileSection>

          <section style={styles.actionSection}>
            <div style={styles.aiIcon}>AI</div>

            <div style={styles.actionContent}>
              <div style={styles.eyebrow}>
                ATUALIZAÇÃO DO PERFIL
              </div>

              <h2 style={styles.actionTitle}>
                Converse com o Coach IA
              </h2>

              <p style={styles.actionText}>
                Para corrigir ou atualizar uma informação, conte ao
                Coach o que mudou.
              </p>
            </div>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() =>
                router.push("/performance-ai/coach?openConversation=1")
              }
            >
              Atualizar meu perfil
            </button>
          </section>
        </>
      )}
    </main>
  );
}

function ProfileSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeader}>
        <div style={styles.eyebrow}>{eyebrow}</div>
        <h2 style={styles.sectionTitle}>{title}</h2>
      </div>

      {children}
    </section>
  );
}

function ProfileItem({
  label,
  value,
  multiline = false,
  last = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.item,
        ...(multiline ? styles.multilineItem : {}),
        ...(last ? styles.lastItem : {}),
      }}
    >
      <div style={styles.itemLabel}>{label}</div>

      <div
        style={{
          ...styles.itemValue,
          ...(multiline ? styles.multilineValue : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    minHeight: "100dvh",
    boxSizing: "border-box",
    paddingBottom: "max(110px, env(safe-area-inset-bottom))",
    background:
      "radial-gradient(circle at 50% -160px, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.04) 28%, rgba(8,8,10,0) 52%), linear-gradient(180deg, #09090b 0%, #050506 58%, #000 100%)",
    color: "#f4f4f5",
    fontFamily: "Montserrat, sans-serif",
  },

  header: {
  width: "100%",
  boxSizing: "border-box",
  padding: "20px 16px 28px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
},

  eyebrow: {
    color: "#d4af37",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.16em",
  },

  title: {
  margin: "8px 0 0",
  fontSize: "clamp(34px, 8vw, 46px)",
  fontWeight: 400,
  lineHeight: 1.04,
  letterSpacing: "-0.045em",
},

  subtitle: {
  maxWidth: 760,
  margin: "12px 0 0",
  color: "rgba(255,255,255,0.48)",
  fontSize: 13,
  lineHeight: 1.7,
},

  section: {
  width: "100%",
  boxSizing: "border-box",
  padding: "30px 16px 0",
},

  sectionHeader: {
  paddingBottom: 12,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
},

  sectionTitle: {
  margin: "7px 0 0",
  fontSize: 22,
  fontWeight: 400,
  lineHeight: 1.2,
  letterSpacing: "-0.03em",
},

  item: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  width: "100%",
  minHeight: 54,
  boxSizing: "border-box",
  padding: "14px 0",
  borderBottom: "1px solid rgba(255,255,255,0.055)",
},

  multilineitem: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  width: "100%",
  minHeight: 54,
  boxSizing: "border-box",
  padding: "14px 0",
  borderBottom: "1px solid rgba(255,255,255,0.055)",
},

  lastitem: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  width: "100%",
  minHeight: 54,
  boxSizing: "border-box",
  padding: "14px 0",
  borderBottom: "1px solid rgba(255,255,255,0.055)",
},

  itemLabel: {
  flexShrink: 0,
  color: "rgba(255,255,255,0.38)",
  fontSize: 10,
  fontWeight: 600,
},

  itemValue: {
  maxWidth: "66%",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.5,
  textAlign: "right",
  overflowWrap: "anywhere",
},

  multilineValue: {
  maxWidth: 780,
  marginTop: 9,
  color: "rgba(255,255,255,0.72)",
  fontWeight: 400,
  lineHeight: 1.7,
  textAlign: "left",
},

  messagesection: {
  width: "100%",
  boxSizing: "border-box",
  padding: "30px 16px 0",
},

  messagetitle: {
  margin: "8px 0 0",
  fontSize: "clamp(34px, 8vw, 46px)",
  fontWeight: 400,
  lineHeight: 1.04,
  letterSpacing: "-0.045em",
},

  messageText: {
    maxWidth: 720,
    margin: "0 0 26px",
    color: "#a1a1aa",
    fontSize: 14,
    lineHeight: 1.65,
  },

  aiIcon: {
  display: "grid",
  placeItems: "center",
  width: 46,
  height: 46,
  borderRadius: 14,
  border: "1px solid rgba(212,175,55,0.35)",
  background: "rgba(212,175,55,0.06)",
  color: "#D4AF37",
  fontSize: 12,
  fontWeight: 700,
},

  actionSection: {
  width: "100%",
  boxSizing: "border-box",
  marginTop: 40,
  padding: "30px 16px 16px",
  borderTop: "1px solid rgba(255,255,255,0.09)",
  background: "transparent",
},

  actionContent: {
    maxWidth: 760,
    marginTop: 19,
  },

  actionTitle: {
  margin: "8px 0 9px",
  fontSize: 24,
  fontWeight: 400,
  lineHeight: 1.18,
  letterSpacing: "-0.03em",
},

  actionText: {
  margin: "0 0 20px",
  color: "rgba(255,255,255,0.45)",
  fontSize: 12,
  lineHeight: 1.7,
},

  primaryButton: {
  width: "100%",
  minHeight: 50,
  boxSizing: "border-box",
  border: "1px solid rgba(212,175,55,0.55)",
  borderRadius: 11,
  background:
    "linear-gradient(180deg, #D8B84C 0%, #B58C20 100%)",
  color: "#09090b",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
},

  secondaryButton: {
    width: "100%",
    minHeight: 50,
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.17)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.055)",
    color: "#f4f4f5",
    fontFamily: "Montserrat, sans-serif",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
};




