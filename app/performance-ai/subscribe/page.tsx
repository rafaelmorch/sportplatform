"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase-browser";

export default function PerformanceAiSubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const paymentState =
    searchParams.get("payment");

  const beginCheckout = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const accessToken =
        sessionData.session?.access_token;

      if (!accessToken) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "/api/performance-ai/create-checkout",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const json =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          json?.error ??
            "Não foi possível iniciar o pagamento."
        );
      }

      if (
        typeof json?.url !== "string" ||
        !json.url
      ) {
        throw new Error(
          "O Stripe não retornou a página de pagamento."
        );
      }

      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: json.url });
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao iniciar o pagamento."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
  <main
    style={{
      width: "100%",
      height: "100dvh",
      overflow: "hidden",
      boxSizing: "border-box",

      paddingTop:
        "max(16px, env(safe-area-inset-top))",

      paddingLeft: 18,
      paddingRight: 18,

      paddingBottom:
        "calc(72px + env(safe-area-inset-bottom))",

      background:
        "radial-gradient(circle at 50% -100px, rgba(212,175,55,0.10), transparent 34%), #050505",

      color: "#ffffff",
      fontFamily: "Montserrat, sans-serif",
    }}
  >
    <section
      style={{
        width: "min(680px, 100%)",
        height: "100%",
        margin: "0 auto",

        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: 10,
        overflow: "hidden",
      }}
    >
      {/* CABEÇALHO */}
      <header
        style={{
          flexShrink: 0,
          marginBottom: 21,
        }}
      >
        <div
          style={{
            color: "#D4AF37",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Performance AI
        </div>

        <h1
          style={{
            margin: "3px 0 0",
            fontSize:
              "clamp(34px, 8vw, 50px)",
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: "-0.045em",
          }}
        >
          Seu Coach IA
        </h1>

        <p
          style={{
            maxWidth: 560,
            margin: "2px 0 0",

            color:
              "#D6D3C8",

            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          Treinamento, alimentação e acompanhamento
          personalizados com base nos seus dados
          esportivos e de saúde.
        </p>

        {paymentState === "cancelled" ? (
          <div style={noticeStyle}>
            O pagamento foi cancelado. Nenhuma cobrança
            foi realizada.
          </div>
        ) : null}

        {paymentState === "processing" ? (
          <div style={noticeStyle}>
            Seu pagamento foi recebido e a assinatura
            ainda está sendo confirmada.
          </div>
        ) : null}
      </header>

      {/* ÁREA CENTRAL */}
      <section
        style={{
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          marginTop: 0,
          marginBottom: 21,
        }}
      >
        <div
          style={{
            flexShrink: 0,

            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",

            gap: 1,
            marginBottom: 0,
          }}
        >
          <div>
            <div
              style={{
                color: "#D4AF37",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
              }}
            >
              O que você recebe
            </div>

            <h2
              style={{
                margin: "2px 0 0",
                color: "#ffffff",

                fontSize:
                  "clamp(15px, 4vw, 18px)",

                fontWeight: 400,
                lineHeight: 1.25,
              }}
            >
              Um Coach que entende o seu contexto
            </h2>
          </div>

          <span
            style={{
              flexShrink: 0,
              color:
                "#A9A69C",
              fontSize: 14,
            }}
          >
            Deslize →
          </span>
        </div>

        {/* CARROSSEL */}
        <div
          style={{
            width: "100%",

            display: "flex",
            alignItems: "center",

            gap: 1,

            overflowX: "auto",
            overflowY: "hidden",

            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",

            WebkitOverflowScrolling:
              "touch",

            scrollbarWidth: "none",

            paddingBottom: 2,
          }}
        >
          {[
            {
              number: "01",
              title:
                "Seu plano se adapta a você",
              text:
                "O Coach combina seu objetivo, disponibilidade, histórico de treinos e evolução para organizar os próximos 7 dias.",
              detail:
                "Seu planejamento deixa de ser uma sequência genérica e passa a considerar o momento atual da sua preparação.",
            },
            {
              number: "02",
              title:
                "Treino com contexto, não genérico",
              text:
                "Distância, duração, frequência cardíaca e histórico esportivo ajudam o Coach a entender sua carga atual.",
              detail:
                "A orientação de cada dia considera o que você já fez, sua capacidade atual e o que vem pela frente.",
            },
            {
              number: "03",
              title:
                "Treino e alimentação juntos",
              text:
                "A estratégia alimentar acompanha a exigência do treino e a recuperação necessária naquele dia.",
              detail:
                "Treinos mais exigentes e dias de recuperação recebem orientações diferentes de alimentação e hidratação.",
            },
            {
              number: "04",
              title:
                "Sua performance em um único contexto",
              text:
                "Perfil, corpo, exames, alimentação e dados esportivos passam a fazer parte da mesma análise.",
              detail:
                "Em vez de informações isoladas, o Coach utiliza o conjunto de dados disponível para compreender melhor sua evolução.",
            },
            {
              number: "05",
              title:
                "Pergunte, ajuste e evolua",
              text:
                "Converse com o Coach sobre treino, recuperação, provas e mudanças no seu planejamento.",
              detail:
                "Você pode tirar dúvidas e contextualizar situações que os números sozinhos não conseguem explicar.",
            },
            {
              number: "06",
              title:
                "Planejado x realizado",
              text:
                "Veja o que estava programado e compare com seus treinos e refeições realmente registrados.",
              detail:
                "O histórico ajuda a identificar consistência, mudanças de rotina e oportunidades de ajuste no próximo ciclo.",
            },
          ].map((feature) => (
            <article
              key={feature.number}
              style={{
                flex:
                  "0 0 calc(92% - 8px)",

                height: 270,
                minHeight: 270,

                boxSizing: "border-box",

                padding:
                  "clamp(18px, 4vw, 24px)",

                display: "flex",
                flexDirection: "column",

                border:
                  "1px solid rgba(212,175,55,0.20)",

                borderRadius: 16,

                background:
                  "linear-gradient(160deg, rgba(212,175,55,0.075) 0%, rgba(255,255,255,0.018) 45%, rgba(255,255,255,0.008) 100%)",

                scrollSnapAlign: "start",
                scrollSnapStop: "always",

                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                }}
              >
                <span
                  style={{
                    color: "#D4AF37",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                  }}
                >
                  {feature.number}
                </span>

                <div
                  aria-hidden="true"
                  style={{
                    width: 30,
                    height: 30,

                    display: "grid",
                    placeItems: "center",

                    border:
                      "1px solid rgba(212,175,55,0.26)",

                    borderRadius: "50%",

                    color: "#D4AF37",
                    fontSize: 12,
                  }}
                >
                  ✦
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                }}
              >
                <h3
                  style={{
                    margin: 0,

                    color: "#ffffff",

                    fontSize:
                      "clamp(20px, 5vw, 27px)",

                    fontWeight: 500,
                    lineHeight: 1.15,

                    letterSpacing:
                      "-0.025em",
                  }}
                >
                  {feature.title}
                </h3>

                <p
                  style={{
                    margin: "12px 0 0",

                    color:
                      "#D6D3C8",

                    fontSize:
                      "clamp(13px, 3.2vw, 15px)",

                    lineHeight: 1.65,
                  }}
                >
                  {feature.text}
                </p>

                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 16,

                    borderTop:
                      "1px solid rgba(255,255,255,0.08)",

                    color:
                      "#A9A69C",

                    fontSize:
                      "clamp(12px, 2.8vw, 13px)",

                    lineHeight: 1.65,
                  }}
                >
                  {feature.detail}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PREÇO / CTA */}
      <footer
        style={{
          flexShrink: 0,

          paddingTop: 3,

          borderTop:
            "1px solid rgba(255,255,255,0.09)",

          background: "#050505",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 1,
          }}
        >
          <div
            style={{
              fontSize:
                "clamp(32px, 8vw, 44px)",

              fontWeight: 400,
              lineHeight: 0.95,

              letterSpacing: "-0.04em",
            }}
          >
            US$ 24,99
          </div>

          <div
            style={{
              paddingBottom: 3,

              color:
                "#A9A69C",

              fontSize: 14,
            }}
          >
            por mês
          </div>
        </div>

        <div
          style={{
            marginTop: 6,

            color:
              "#A9A69C",

            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          Renovação automática mensal. Sem período
          gratuito. Cancele quando desejar.
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "flex-start",

            gap: 8,
            marginTop: 6,

            color:
              "#D6D3C8",

            fontSize: 15,
            lineHeight: 1.5,

            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) =>
              setAcceptedTerms(
                event.target.checked
              )
            }
            style={{
              width: 15,
              height: 15,

              marginTop: 0,

              flexShrink: 0,

              accentColor: "#D4AF37",
            }}
          />

          <span>
            Li e concordo com os{" "}
            <a
              href="/terms"
              target="_blank"
              style={{
                color: "#D4AF37",
              }}
            >
              Termos de Uso
            </a>{" "}
            e com a{" "}
            <a
              href="/privacy"
              target="_blank"
              style={{
                color: "#D4AF37",
              }}
            >
              Política de Privacidade
            </a>
            .
          </span>
        </label>

        {errorMessage ? (
          <div
            role="alert"
            style={{
              marginTop: 8,

              padding: "8px 10px",

              border:
                "1px solid rgba(248,113,113,0.28)",

              borderRadius: 8,

              background:
                "rgba(127,29,29,0.12)",

              color: "#fecaca",

              fontSize: 11,
              lineHeight: 1.45,
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          disabled={
            loading || !acceptedTerms
          }
          onClick={() =>
            void beginCheckout()
          }
          style={{
            width: "100%",
            minHeight: 43,

            marginTop: 6,

            border:
              "1px solid rgba(212,175,55,0.68)",

            borderRadius: 10,

            background:
              loading ||
              !acceptedTerms
                ? "rgba(212,175,55,0.10)"
                : "linear-gradient(180deg, #DDBD4F 0%, #B88B1D 100%)",

            color:
              loading ||
              !acceptedTerms
                ? "#756a4b"
                : "#090909",

            fontFamily:
              "Montserrat, sans-serif",

            fontSize: 13,
            fontWeight: 700,

            cursor:
              loading ||
              !acceptedTerms
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading
            ? "Abrindo pagamento..."
            : "Assinar Performance AI"}
        </button>

        {paymentState ===
        "processing" ? (
          <button
            type="button"
            onClick={() =>
              router.replace(
                "/performance-ai"
              )
            }
            style={{
              width: "100%",
              minHeight: 36,

              marginTop: 6,

              border:
                "1px solid rgba(255,255,255,0.12)",

              borderRadius: 8,

              background:
                "transparent",

              color: "#d4d4d8",

              fontFamily: "inherit",
              fontSize: 11,

              cursor: "pointer",
            }}
          >
            Verificar assinatura novamente
          </button>
        ) : null}
      </footer>
    </section>
  </main>
);

}
const noticeStyle: React.CSSProperties = {
  marginTop: 12,
  padding: "10px 12px",
  border:
    "1px solid rgba(212,175,55,0.22)",
  borderRadius: 10,
  background:
    "rgba(212,175,55,0.05)",
  color: "#d4d4d8",
  fontSize: 10.5,
  lineHeight: 1.55,
};



















