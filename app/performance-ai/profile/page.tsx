"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { supabaseBrowser } from "@/lib/supabase-browser";

type PerformanceAiProfile = {
  id: string;
  user_id: string;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  goal: string | null;
  health_notes: string | null;
  goal_text: string | null;
  goal_date: string | null;
  level: string | null;
  days_per_week: number | null;
  minutes_per_session: number | null;
  sports: string[] | string | null;
};

function hasValue(
  value: string | number | string[] | null | undefined
): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
}

function formatGender(value: string | null): string {
  if (!value) return "Não informado";

  const normalized = value.trim().toLowerCase();

  const labels: Record<string, string> = {
    male: "Masculino",
    masculino: "Masculino",
    man: "Masculino",
    homem: "Masculino",
    female: "Feminino",
    feminino: "Feminino",
    woman: "Feminino",
    mulher: "Feminino",
    other: "Outro",
    outro: "Outro",
    "prefer_not_to_say": "Prefiro não informar",
  };

  return labels[normalized] ?? value;
}

function formatGoal(value: string | null): string {
  if (!value) return "Não informado";

  const normalized = value.trim().toLowerCase();

  const labels: Record<string, string> = {
    performance: "Melhorar minha performance",
    weight_loss: "Perder peso",
    "weight loss": "Perder peso",
    emagrecimento: "Perder peso",
    conditioning: "Melhorar meu condicionamento",
    condicionamento: "Melhorar meu condicionamento",
    health: "Melhorar minha saúde",
    saude: "Melhorar minha saúde",
    maintenance: "Manter minha saúde e desempenho",
    race: "Preparação para uma prova",
    competition: "Preparação para uma competição",
    other: "Outro objetivo",
  };

  return labels[normalized] ?? value;
}

function formatLevel(value: string | null): string {
  if (!value) return "Não informado";

  const normalized = value.trim().toLowerCase();

  const labels: Record<string, string> = {
    beginner: "Iniciante",
    iniciante: "Iniciante",
    intermediate: "Intermediário",
    intermediario: "Intermediário",
    intermediário: "Intermediário",
    advanced: "Avançado",
    avancado: "Avançado",
    avançado: "Avançado",
  };

  return labels[normalized] ?? value;
}

function formatDate(value: string | null): string {
  if (!value) return "Não informada";

  const dateOnly = value.slice(0, 10);
  const parts = dateOnly.split("-");

  if (parts.length !== 3) {
    return value;
  }

  const [year, month, day] = parts;

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatSports(value: string[] | string | null): string {
  if (!value) return "Não informadas";

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Não informadas";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "Não informadas";
  }

  try {
    const parsed = JSON.parse(trimmed);

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
      setLoading(true);
      setErrorMessage("");

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
          [
            "id",
            "user_id",
            "weight_kg",
            "height_cm",
            "age",
            "gender",
            "goal",
            "health_notes",
            "goal_text",
            "goal_date",
            "level",
            "days_per_week",
            "minutes_per_session",
            "sports",
          ].join(",")
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Error loading Performance AI profile:", error);
        setErrorMessage(
          "Não foi possível carregar seu perfil neste momento."
        );
        setLoading(false);
        return;
      }

      setProfile((data as PerformanceAiProfile | null) ?? null);
      setLoading(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  const completedFields = useMemo(() => {
    if (!profile) return 0;

    const values = [
      profile.age,
      profile.gender,
      profile.height_cm,
      profile.weight_kg,
      profile.goal,
      profile.goal_text,
      profile.goal_date,
      profile.level,
      profile.days_per_week,
      profile.minutes_per_session,
      profile.sports,
      profile.health_notes,
    ];

    return values.filter(hasValue).length;
  }, [profile]);

  const profilePercentage = Math.round(
    (completedFields / 12) * 100
  );

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <BackButton />

          <div style={styles.hero}>
            <div style={styles.eyebrow}>PERFORMANCE AI</div>

            <h1 style={styles.title}>Meu perfil</h1>

            <p style={styles.subtitle}>
              Os dados que o Coach IA utiliza para compreender seu momento,
              seus objetivos e personalizar suas orientações.
            </p>
          </div>
        </div>
      </header>

      {loading ? (
        <section style={styles.loadingSection}>
          <div style={styles.loadingIndicator} />

          <div>
            <div style={styles.loadingTitle}>
              Carregando seu perfil
            </div>

            <div style={styles.loadingText}>
              Organizando as informações conhecidas pelo Coach IA.
            </div>
          </div>
        </section>
      ) : errorMessage ? (
        <section style={styles.emptySection}>
          <div style={styles.statusIcon}>!</div>

          <h2 style={styles.emptyTitle}>
            Não foi possível carregar seu perfil
          </h2>

          <p style={styles.emptyText}>{errorMessage}</p>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </section>
      ) : !profile ? (
        <section style={styles.emptySection}>
          <div style={styles.statusIcon}>AI</div>

          <div style={styles.emptyEyebrow}>PRIMEIRA CONSULTA</div>

          <h2 style={styles.emptyTitle}>
            O Coach IA ainda não conhece você
          </h2>

          <p style={styles.emptyText}>
            Faça sua consulta inicial para informar seus dados, objetivos,
            experiência, disponibilidade e limitações.
          </p>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() =>
              router.push("/performance-ai/coach/consultation")
            }
          >
            Iniciar consulta
          </button>
        </section>
      ) : (
        <>
          <section style={styles.completionSection}>
            <div style={styles.completionTop}>
              <div>
                <div style={styles.sectionEyebrow}>
                  PERFIL DO COACH IA
                </div>

                <div style={styles.completionTitle}>
                  Informações disponíveis
                </div>
              </div>

              <div style={styles.percentage}>
                {profilePercentage}%
              </div>
            </div>

            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressBar,
                  width: `${profilePercentage}%`,
                }}
              />
            </div>

            <p style={styles.completionText}>
              Quanto mais completo estiver seu perfil, mais personalizadas
              poderão ser as orientações do Coach IA.
            </p>
          </section>

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
              value={profile.goal_text || "Não informada"}
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
              label="Dias disponíveis"
              value={
                profile.days_per_week !== null
                  ? `${profile.days_per_week} ${
                      profile.days_per_week === 1
                        ? "dia por semana"
                        : "dias por semana"
                    }`
                  : "Não informado"
              }
            />

            <ProfileItem
              label="Tempo por sessão"
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
              value={
                profile.health_notes ||
                "Nenhuma informação registrada"
              }
              multiline
              last
            />
          </ProfileSection>

          <section style={styles.actionSection}>
            <div style={styles.actionIcon}>AI</div>

            <div style={styles.actionContent}>
              <div style={styles.actionEyebrow}>
                PRECISA ATUALIZAR ALGO?
              </div>

              <h2 style={styles.actionTitle}>
                Converse com o Coach IA
              </h2>

              <p style={styles.actionText}>
                Seus dados não são alterados diretamente nesta página.
                Conte ao Coach o que mudou e ele atualizará seu perfil.
              </p>
            </div>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() =>
                router.push("/performance-ai/coach/consultation")
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
  children: React.ReactNode;
}) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionEyebrow}>{eyebrow}</div>
        <h2 style={styles.sectionTitle}>{title}</h2>
      </div>

      <div style={styles.items}>{children}</div>
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
        ...(multiline ? styles.itemMultiline : {}),
        ...(last ? styles.itemLast : {}),
      }}
    >
      <div style={styles.itemLabel}>{label}</div>

      <div
        style={{
          ...styles.itemValue,
          ...(multiline ? styles.itemValueMultiline : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: "100%",
    minHeight: "100dvh",
    boxSizing: "border-box",
    paddingBottom: "max(110px, env(safe-area-inset-bottom))",
    background:
      "radial-gradient(circle at 50% -160px, rgba(212,175,55,0.17) 0%, rgba(212,175,55,0.04) 27%, rgba(8,8,10,0) 53%), linear-gradient(180deg, #09090b 0%, #050506 55%, #000000 100%)",
    color: "#f4f4f5",
    fontFamily: "Montserrat, sans-serif",
  },

  header: {
    width: "100%",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  headerContent: {
    width: "100%",
    boxSizing: "border-box",
    padding: "22px 16px 34px",
  },

  hero: {
    marginTop: 28,
  },

  eyebrow: {
    marginBottom: 10,
    color: "#d4af37",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.17em",
  },

  title: {
    margin: 0,
    fontSize: "clamp(31px, 8vw, 48px)",
    fontWeight: 850,
    lineHeight: 1.03,
    letterSpacing: "-0.045em",
  },

  subtitle: {
    maxWidth: 760,
    margin: "14px 0 0",
    color: "#a1a1aa",
    fontSize: 14,
    lineHeight: 1.65,
  },

  loadingSection: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    width: "100%",
    boxSizing: "border-box",
    padding: "40px 16px",
  },

  loadingIndicator: {
    width: 22,
    height: 22,
    flexShrink: 0,
    borderRadius: "50%",
    border: "2px solid rgba(212,175,55,0.2)",
    borderTopColor: "#d4af37",
  },

  loadingTitle: {
    color: "#f4f4f5",
    fontSize: 14,
    fontWeight: 750,
  },

  loadingText: {
    marginTop: 5,
    color: "#777780",
    fontSize: 12,
    lineHeight: 1.5,
  },

  emptySection: {
    width: "100%",
    boxSizing: "border-box",
    padding: "42px 16px",
  },

  statusIcon: {
    display: "grid",
    placeItems: "center",
    width: 58,
    height: 58,
    borderRadius: 18,
    border: "1px solid rgba(212,175,55,0.45)",
    background: "rgba(212,175,55,0.1)",
    color: "#f0d47a",
    fontSize: 15,
    fontWeight: 900,
  },

  emptyEyebrow: {
    marginTop: 26,
    color: "#d4af37",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.15em",
  },

  emptyTitle: {
    maxWidth: 720,
    margin: "10px 0 12px",
    color: "#f4f4f5",
    fontSize: "clamp(25px, 7vw, 36px)",
    lineHeight: 1.12,
    letterSpacing: "-0.035em",
  },

  emptyText: {
    maxWidth: 720,
    margin: "0 0 28px",
    color: "#a1a1aa",
    fontSize: 14,
    lineHeight: 1.65,
  },

  completionSection: {
    width: "100%",
    boxSizing: "border-box",
    padding: "30px 16px 34px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  completionTop: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
  },

  completionTitle: {
    marginTop: 7,
    color: "#f4f4f5",
    fontSize: 18,
    fontWeight: 800,
  },

  percentage: {
    color: "#f0d47a",
    fontSize: 24,
    fontWeight: 850,
    letterSpacing: "-0.03em",
  },

  progressTrack: {
    width: "100%",
    height: 5,
    marginTop: 18,
    overflow: "hidden",
    borderRadius: 999,
    background: "rgba(255,255,255,0.09)",
  },

  progressBar: {
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, #9b7719 0%, #d4af37 55%, #f0d47a 100%)",
    transition: "width 300ms ease",
  },

  completionText: {
    maxWidth: 720,
    margin: "13px 0 0",
    color: "#777780",
    fontSize: 12,
    lineHeight: 1.55,
  },

  section: {
    width: "100%",
    boxSizing: "border-box",
    padding: "32px 16px 0",
  },

  sectionHeader: {
    paddingBottom: 16,
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  },

  sectionEyebrow: {
    color: "#d4af37",
    fontSize: 9,
    fontWeight: 850,
    letterSpacing: "0.16em",
  },

  sectionTitle: {
    margin: "7px 0 0",
    color: "#f4f4f5",
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: "-0.025em",
  },

  items: {
    width: "100%",
  },

  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    width: "100%",
    minHeight: 58,
    boxSizing: "border-box",
    padding: "16px 0",
    borderBottom: "1px solid rgba(255,255,255,0.075)",
  },

  itemMultiline: {
    display: "block",
  },

  itemLast: {
    borderBottom: "none",
  },

  itemLabel: {
    flexShrink: 0,
    color: "#777780",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.015em",
  },

  itemValue: {
    maxWidth: "64%",
    color: "#e4e4e7",
    fontSize: 13,
    fontWeight: 650,
    lineHeight: 1.55,
    textAlign: "right",
    overflowWrap: "anywhere",
  },

  itemValueMultiline: {
    maxWidth: 780,
    marginTop: 9,
    color: "#d4d4d8",
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.65,
    textAlign: "left",
  },

  actionSection: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 36,
    padding: "34px 16px 16px",
    borderTop: "1px solid rgba(212,175,55,0.23)",
    background:
      "linear-gradient(180deg, rgba(212,175,55,0.055) 0%, rgba(212,175,55,0.015) 100%)",
  },

  actionIcon: {
    display: "grid",
    placeItems: "center",
    width: 48,
    height: 48,
    borderRadius: 15,
    border: "1px solid rgba(212,175,55,0.4)",
    background: "rgba(212,175,55,0.09)",
    color: "#f0d47a",
    fontSize: 13,
    fontWeight: 900,
  },

  actionContent: {
    maxWidth: 760,
    marginTop: 20,
  },

  actionEyebrow: {
    color: "#d4af37",
    fontSize: 9,
    fontWeight: 850,
    letterSpacing: "0.16em",
  },

  actionTitle: {
    margin: "8px 0 10px",
    color: "#f4f4f5",
    fontSize: 23,
    fontWeight: 820,
    lineHeight: 1.18,
    letterSpacing: "-0.03em",
  },

  actionText: {
    margin: "0 0 23px",
    color: "#92929b",
    fontSize: 13,
    lineHeight: 1.65,
  },

  primaryButton: {
    width: "100%",
    minHeight: 52,
    boxSizing: "border-box",
    border: "1px solid rgba(240,212,122,0.7)",
    borderRadius: 12,
    background:
      "linear-gradient(180deg, #e2c65f 0%, #b68d20 100%)",
    color: "#09090b",
    fontFamily: "Montserrat, sans-serif",
    fontSize: 13,
    fontWeight: 850,
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
