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
      minHeight: "100dvh",
      overflowX: "hidden",
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
        minHeight: "100%",
        margin: "0 auto",

        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: 10,
        overflowX: "hidden",
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
            color: "#F1D36B",
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
          overflowX: "hidden",
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

            gap: 12,
            marginBottom: 0,
          }}
        >
          <div>
            <div
              style={{
                color: "#F1D36B",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              O que você recebe
            </div>

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

            gap: 12,

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
          title: "Entenda sua performance",
          text:
            "Acompanhe seu score e receba orientações baseadas nos seus dados.",
          image:
            "/performance-ai/subscribe/performance.png",
        },
        {
          number: "02",
          title: "Seu plano, dia após dia",
          text:
            "Visualize treinos e alimentação em um calendário feito para sua rotina.",
          image:
            "/performance-ai/subscribe/plan-calendar.png",
        },
        {
          number: "03",
          title: "Treinos feitos para você",
          text:
            "Veja intensidade, objetivo e orientações de cada treino do seu plano.",
          image:
            "/performance-ai/subscribe/daily-plan.png",
        },
        {
          number: "04",
          title: "Nutrição com IA",
          text:
            "Fotografe sua refeição para identificar alimentos, porções e informações nutricionais.",
          image:
            "/performance-ai/subscribe/nutrition-ai.png",
        },
        {
          number: "05",
          title: "Seu Coach sempre por perto",
          text:
            "Tire dúvidas sobre treinos, recuperação, alimentação e evolução esportiva.",
          image:
            "/performance-ai/subscribe/coach-chat.png",
        },
        {
          number: "06",
          title: "Sua saúde também faz parte do plano",
          text:
            "Use exames de sangue e bioimpedância para dar mais contexto às análises do Coach.",
          image:
            "/performance-ai/subscribe/exames.png",
        },
      ].map((feature) => (
        <article
          key={feature.number}
          style={{
            flex: "0 0 72%",
            height: "auto",
            minHeight: 0,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            border:
              "1px solid rgba(241,211,107,0.20)",
            borderRadius: 16,
            background:
              "linear-gradient(160deg, rgba(241,211,107,0.055) 0%, rgba(255,255,255,0.018) 45%, rgba(255,255,255,0.008) 100%)",
            scrollSnapAlign: "start",
            scrollSnapStop: "always",
            overflowX: "hidden",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
            height: "auto",
              flexShrink: 0,
              overflowX: "hidden",
              background: "#050505",
              borderBottom:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <img
              src={feature.image}
              alt={feature.title}
              style={{
                width: "100%",
                minHeight: "100%",
                objectFit: "cover",
                objectPosition: "top",
                display: "block",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                minWidth: 28,
            height: "auto",
                padding: "0 8px",
                display: "grid",
                placeItems: "center",
                borderRadius: 999,
                border:
                  "1px solid rgba(241,211,107,0.30)",
                background:
                  "rgba(5,5,5,0.82)",
                color: "#F1D36B",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                backdropFilter: "blur(8px)",
              }}
            >
              {feature.number}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "13px 15px 14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize:
                  "clamp(17px, 4vw, 21px)",
                fontWeight: 500,
                lineHeight: 1.18,
                letterSpacing: "-0.025em",
              }}
            >
              {feature.title}
            </h3>

            <p
              style={{
                margin: "8px 0 0",
                color: "#D6D3C8",
                fontSize:
                  "clamp(12px, 2.8vw, 13px)",
                lineHeight: 1.5,
              }}
            >
              {feature.text}
            </p>
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
            gap: 12,
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
          Renovação automática mensal. Cancele quando desejar.
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
              aspectRatio: "450 / 823",

              marginTop: 0,

              flexShrink: 0,

              accentColor: "#F1D36B",
            }}
          />

          <span>
            Li e concordo com os{" "}
            <a
              href="/terms"
              target="_blank"
              style={{
                color: "#F1D36B",
              }}
            >
              Termos de Uso
            </a>{" "}
            e com a{" "}
            <a
              href="/privacy"
              target="_blank"
              style={{
                color: "#F1D36B",
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




































