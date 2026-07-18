"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import BackButton from "@/components/BackButton";

type Language = "pt" | "en";
type Answer = "yes" | "no" | "";

type Answers = {
  q1: Answer;
  q2: Answer;
  q3: Answer;
  q4: Answer;
  q5: Answer;
  q6: Answer;
  q7: Answer;
};

const INITIAL_ANSWERS: Answers = {
  q1: "",
  q2: "",
  q3: "",
  q4: "",
  q5: "",
  q6: "",
  q7: "",
};

const QUESTIONS: Array<{
  key: keyof Answers;
  pt: string;
  en: string;
}> = [
  {
    key: "q1",
    pt: "Algum médico já informou que você possui um problema cardíaco e que só deve praticar atividade física recomendada por um médico?",
    en: "Has your doctor ever said that you have a heart condition and that you should only perform physical activity recommended by a doctor?",
  },
  {
    key: "q2",
    pt: "Você sente dor no peito durante a prática de atividade física?",
    en: "Do you feel pain in your chest when you perform physical activity?",
  },
  {
    key: "q3",
    pt: "No último mês, você sentiu dor no peito mesmo sem estar praticando atividade física?",
    en: "In the past month, have you had chest pain when you were not performing physical activity?",
  },
  {
    key: "q4",
    pt: "Você perde o equilíbrio por causa de tontura ou já perdeu a consciência?",
    en: "Do you lose your balance because of dizziness, or have you ever lost consciousness?",
  },
  {
    key: "q5",
    pt: "Você possui algum problema ósseo ou articular que possa piorar com uma mudança na sua atividade física?",
    en: "Do you have a bone or joint problem that could be made worse by a change in your physical activity?",
  },
  {
    key: "q6",
    pt: "Atualmente, algum médico prescreve medicamentos para sua pressão arterial ou para alguma condição cardíaca?",
    en: "Is your doctor currently prescribing medication for your blood pressure or heart condition?",
  },
  {
    key: "q7",
    pt: "Você conhece algum outro motivo pelo qual não deveria praticar atividade física?",
    en: "Do you know of any other reason why you should not perform physical activity?",
  },
];

const COPY = {
  pt: {
    title: "Saúde e Segurança",
    subtitle:
      "Responda este breve questionário antes de acessar sua comunidade.",
    sectionTitle: "Questionário de Prontidão para Atividade Física — PAR-Q",
    sectionDescription: "Selecione Sim ou Não em todas as perguntas.",
    yes: "Sim",
    no: "Não",
    warningTitle: "Importante",
    warning:
      "Uma ou mais respostas foram marcadas como Sim. Recomendamos que você consulte um profissional de saúde qualificado antes de iniciar ou continuar a prática de atividade física.",
    waiverTitle: "Termo de Assunção de Risco e Isenção de Responsabilidade",
    waiver:
      "Declaro estar ciente de que a participação em esportes, exercícios, desafios, treinamentos e atividades relacionadas envolve riscos inerentes, incluindo lesões, doenças, incapacidade ou morte. Escolho participar voluntariamente e assumo a responsabilidade por avaliar minha própria saúde e condição física. Isento a Platform Sports, suas comunidades, organizadores, treinadores, parceiros, funcionários e representantes de reclamações decorrentes da minha participação, na máxima extensão permitida pela legislação aplicável.",
    certify:
      "Declaro que minhas respostas são completas, verdadeiras e precisas.",
    accept:
      "Estou ciente dos riscos inerentes à prática de atividade física e aceito este Termo de Assunção de Risco e Isenção de Responsabilidade.",
    submit: "Concluir Cadastro",
    saving: "Salvando...",
    loading: "Carregando Saúde e Segurança...",
    footer:
      "Este questionário não substitui orientação, diagnóstico ou tratamento médico profissional.",
    answerAll: "Responda às sete perguntas antes de continuar.",
    certifyRequired: "Confirme que suas respostas são verdadeiras.",
    waiverRequired:
      "Aceite o Termo de Assunção de Risco e Isenção de Responsabilidade.",
    membershipMissing: "As informações da assinatura não foram encontradas.",
    unexpected: "Ocorreu um erro inesperado. Tente novamente.",
  },
  en: {
    title: "Health & Safety",
    subtitle:
      "Please complete this short questionnaire before accessing your community.",
    sectionTitle: "Physical Activity Readiness Questionnaire — PAR-Q",
    sectionDescription: "Select Yes or No for every question.",
    yes: "Yes",
    no: "No",
    warningTitle: "Important",
    warning:
      "One or more answers were marked Yes. We recommend consulting a qualified healthcare professional before beginning or continuing physical activity.",
    waiverTitle: "Assumption of Risk & Liability Waiver",
    waiver:
      "I understand that participation in sports, exercise, challenges, training sessions, and related activities involves inherent risks, including injury, illness, disability, or death. I voluntarily choose to participate and accept responsibility for evaluating my own health and physical condition. I release Platform Sports, its communities, organizers, coaches, partners, employees, and representatives from claims arising from my participation, to the fullest extent permitted by applicable law.",
    certify: "I certify that my answers are complete, truthful, and accurate.",
    accept:
      "I understand the inherent risks of physical activity and accept this Assumption of Risk and Liability Waiver.",
    submit: "Complete Registration",
    saving: "Saving...",
    loading: "Loading Health & Safety...",
    footer:
      "This questionnaire does not replace professional medical advice, diagnosis, or treatment.",
    answerAll: "Please answer all seven questions before continuing.",
    certifyRequired: "Please certify that your answers are truthful.",
    waiverRequired:
      "Please accept the Assumption of Risk and Liability Waiver.",
    membershipMissing: "Membership information could not be found.",
    unexpected: "An unexpected error occurred. Please try again.",
  },
};

export default function HealthAndSafetyPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const params = useParams();
  const router = useRouter();

  const communityId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [language, setLanguage] = useState<Language>("pt");
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [membershipRequestId, setMembershipRequestId] =
    useState<string | null>(null);
  const [communityName, setCommunityName] = useState("Membership");
  const [answersCertified, setAnswersCertified] = useState(false);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const text = COPY[language];

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      if (!communityId || typeof communityId !== "string") {
        router.replace("/groups");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: community } = await supabase
        .from("app_membership_communities")
        .select("name")
        .eq("id", communityId)
        .maybeSingle();

      if (mounted && community?.name) {
        setCommunityName(community.name);
      }

      const { data: membership, error: membershipError } = await supabase
        .from("app_membership_requests")
        .select("id, status, subscription_status")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (
        membershipError ||
        !membership ||
        membership.status !== "active" ||
        !["active", "trialing"].includes(
          membership.subscription_status ?? ""
        )
      ) {
        router.replace(`/groups/pending?community_id=${communityId}`);
        return;
      }

      if (mounted) {
        setMembershipRequestId(membership.id);
        setLoading(false);
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [communityId, router, supabase]);

  function updateAnswer(key: keyof Answers, value: Answer) {
    setAnswers((current) => ({
      ...current,
      [key]: value,
    }));
    setMessage(null);
  }

  async function handleSubmit() {
    if (!communityId || typeof communityId !== "string") return;

    const allAnswered = Object.values(answers).every(
      (answer) => answer === "yes" || answer === "no"
    );

    if (!allAnswered) {
      setMessage(text.answerAll);
      return;
    }

    if (!answersCertified) {
      setMessage(text.certifyRequired);
      return;
    }

    if (!waiverAccepted) {
      setMessage(text.waiverRequired);
      return;
    }

    if (!membershipRequestId) {
      setMessage(text.membershipMissing);
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const hasPositiveAnswer = Object.values(answers).some(
        (answer) => answer === "yes"
      );

      const { error } = await supabase
        .from("app_membership_health_forms")
        .insert({
          membership_request_id: membershipRequestId,
          user_id: user.id,
          community_id: communityId,
          par_q_answers: answers,
          has_positive_answer: hasPositiveAnswer,
          answers_certified: true,
          waiver_accepted: true,
          form_version: "1.0",
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace(`/groups/${communityId}/inside`);
    } catch (error) {
      console.error("Error saving health form:", error);
      setMessage(text.unexpected);
    } finally {
      setSaving(false);
    }
  }

  const hasPositiveAnswer = Object.values(answers).some(
    (answer) => answer === "yes"
  );

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background:
            "#f1f5f9",
          fontFamily: "Montserrat, sans-serif",
        }}
      >
        <div style={{ color: "#475569", fontWeight: 600 }}>
          {text.loading}
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "#f1f5f9",
        padding: "12px 12px 32px",
        boxSizing: "border-box",
        fontFamily: "Montserrat, sans-serif",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 820,
          margin: "0 auto",
          borderRadius: 0,
          padding: 0,
          boxSizing: "border-box",
          border: "none",
          background: "transparent",
          boxShadow: "none",
          overflowWrap: "break-word",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <BackButton />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              width: "100%",
              maxWidth: 260,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: 4,
              background: "#e5e7eb",
            }}
          >
            {(["pt", "en"] as const).map((option) => {
              const selected = language === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setLanguage(option);
                    setMessage(null);
                  }}
                  style={{
                    minHeight: 42,
                    border: 0,
                    borderRadius: 6,
                    background: selected ? "#111827" : "transparent",
                    color: selected ? "#ffffff" : "#4b5563",
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {option === "pt" ? "Português" : "English"}
                </button>
              );
            })}
          </div>
        </div>

        <header style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-flex",
              maxWidth: "100%",
              padding: "7px 12px",
              borderRadius: 999,
              background: "#111827",
              color: "#f8fafc",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
              overflowWrap: "anywhere",
            }}
          >
            {communityName}
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              color: "#0f172a",
              fontSize: "clamp(24px, 7vw, 32px)",
              lineHeight: 1.2,
              fontWeight: 800,
            }}
          >
            {text.title}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#475569",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {text.subtitle}
          </p>
        </header>

        <section
          style={{
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#e5e7eb",
            padding: "18px clamp(14px, 3vw, 20px)",
          }}
        >
          <h2
            style={{
              margin: "0 0 6px",
              color: "#111827",
              fontSize: 18,
              lineHeight: 1.35,
              fontWeight: 800,
            }}
          >
            {text.sectionTitle}
          </h2>

          <p
            style={{
              margin: "0 0 20px",
              color: "#475569",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {text.sectionDescription}
          </p>

          <div style={{ display: "grid", gap: 14 }}>
            {QUESTIONS.map((question, index) => (
              <div
                key={question.key}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: 16,
                  background: "#f8fafc",
                  boxShadow: "0 5px 16px rgba(15,23,42,0.05)",
                }}
              >
                <div
                  style={{
                    color: "#1e293b",
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  {index + 1}. {question[language]}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                    width: "100%",
                  }}
                >
                  {(["no", "yes"] as const).map((value) => {
                    const selected = answers[question.key] === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateAnswer(question.key, value)}
                        style={{
                          width: "100%",
                          minWidth: 0,
                          minHeight: 46,
                          borderRadius: 6,
                          border: selected
                            ? value === "no"
                              ? "2px solid #15803d"
                              : "2px solid #d97706"
                            : "1px solid #cbd5e1",
                          background: selected
                            ? value === "no"
                              ? "#dcfce7"
                              : "#fef3c7"
                            : "#ffffff",
                          color: selected
                            ? value === "no"
                              ? "#166534"
                              : "#92400e"
                            : "#334155",
                          fontFamily: "Montserrat, sans-serif",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {value === "yes" ? text.yes : text.no}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {hasPositiveAnswer && (
          <section
            style={{
              marginTop: 16,
              padding: "16px clamp(14px, 3vw, 20px)",
              borderRadius: 8,
              border: "1px solid #fbbf24",
              background: "#fffbeb",
              color: "#92400e",
            }}
          >
            <h2
              style={{
                margin: "0 0 7px",
                fontSize: 16,
                lineHeight: 1.4,
                fontWeight: 800,
              }}
            >
              {text.warningTitle}
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.7,
                fontWeight: 600,
              }}
            >
              {text.warning}
            </p>
          </section>
        )}

        <section
          style={{
            marginTop: 16,
            borderRadius: 10,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            padding: "18px clamp(14px, 3vw, 20px)",
          }}
        >
          <h2
            style={{
              margin: "0 0 10px",
              color: "#0f172a",
              fontSize: 18,
              lineHeight: 1.35,
              fontWeight: 800,
            }}
          >
            {text.waiverTitle}
          </h2>

          <p
            style={{
              margin: "0 0 18px",
              color: "#475569",
              fontSize: 13,
              lineHeight: 1.75,
            }}
          >
            {text.waiver}
          </p>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
              minHeight: 44,
              marginBottom: 14,
              color: "#334155",
              fontSize: 13,
              lineHeight: 1.55,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={answersCertified}
              onChange={(event) =>
                setAnswersCertified(event.target.checked)
              }
              style={{
                width: 22,
                height: 22,
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <span>{text.certify}</span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
              minHeight: 44,
              color: "#334155",
              fontSize: 13,
              lineHeight: 1.55,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={waiverAccepted}
              onChange={(event) =>
                setWaiverAccepted(event.target.checked)
              }
              style={{
                width: 22,
                height: 22,
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <span>{text.accept}</span>
          </label>
        </section>

        {message && (
          <div
            style={{
              marginTop: 16,
              padding: 13,
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: 13,
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: "100%",
            minHeight: 52,
            marginTop: 20,
            padding: "10px 14px",
            border: 0,
            borderRadius: 10,
            background: saving
              ? "#94a3b8"
              : "linear-gradient(135deg, #111827 0%, #334155 100%)",
            boxShadow: saving
              ? "none"
              : "0 10px 24px rgba(15,23,42,0.24)",
            color: "#ffffff",
            fontFamily: "Montserrat, sans-serif",
            fontSize: 15,
            lineHeight: 1.4,
            fontWeight: 800,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? text.saving : text.submit}
        </button>

        <p
          style={{
            margin: "14px 0 0",
            textAlign: "center",
            color: "#64748b",
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          {text.footer}
        </p>
      </div>
    </main>
  );
}

