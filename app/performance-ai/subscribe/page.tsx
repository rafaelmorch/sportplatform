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

      window.location.assign(json.url);
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
        minHeight: "100vh",
        boxSizing: "border-box",
        padding:
          "max(22px, env(safe-area-inset-top)) 16px max(40px, env(safe-area-inset-bottom))",
        background:
          "radial-gradient(circle at top right, rgba(255,241,168,0.1), transparent 35%), #050505",
        color: "#ffffff",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(720px, 100%)",
          margin: "0 auto",
          padding: "clamp(30px, 6vw, 58px)",
          boxSizing: "border-box",
          border:
            "1px solid rgba(255,241,168,0.2)",
          borderRadius: 18,
          background: "rgba(10,10,10,0.96)",
          boxShadow:
            "0 28px 90px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            color: "#fff1a8",
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
            margin: "16px 0 0",
            fontSize: "clamp(38px, 8vw, 64px)",
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: "-0.045em",
          }}
        >
          Seu Coach IA
        </h1>

        <p
          style={{
            margin: "22px 0 0",
            color: "#c4c4cc",
            fontSize: "clamp(15px, 2vw, 18px)",
            lineHeight: 1.7,
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
            ainda está sendo confirmada. Aguarde alguns
            segundos e tente acessar novamente.
          </div>
        ) : null}

        <div
          style={{
            marginTop: 34,
            padding: "24px 0",
            borderTop:
              "1px solid rgba(255,255,255,0.1)",
            borderBottom:
              "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {[
            "Plano personalizado para os próximos 7 dias",
            "Treinamento e alimentação ajustados automaticamente",
            "Análise dos seus dados do Strava",
            "Perfil, corpo, saúde e nutrição integrados",
            "Conversa com o Coach IA",
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: "10px 0",
                color: "#e4e4e7",
                fontSize: 15,
                lineHeight: 1.55,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 30,
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: "clamp(40px, 8vw, 58px)",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            US$ 24,99
          </div>

          <div
            style={{
              paddingBottom: 7,
              color: "#a1a1aa",
              fontSize: 14,
            }}
          >
            por mês
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            color: "#85858e",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Renovação automática mensal. Sem período
          gratuito. Cancele quando desejar.
        </div>


        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginTop: 24,
            color: "#d4d4d8",
            fontSize: 13,
            lineHeight: 1.7,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) =>
              setAcceptedTerms(event.target.checked)
            }
            style={{
              width: 20,
              height: 20,
              marginTop: 2,
              flexShrink: 0,
            }}
          />

          <span>
            Li e concordo com os{" "}
            <a
              href="/terms"
              target="_blank"
              style={{
                color: "#FFF1A8",
              }}
            >
              Termos de Uso
            </a>{" "}
            e com a{" "}
            <a
              href="/privacy"
              target="_blank"
              style={{
                color: "#FFF1A8",
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
              marginTop: 20,
              padding: "13px 15px",
              border:
                "1px solid rgba(248,113,113,0.35)",
              background:
                "rgba(127,29,29,0.14)",
              color: "#fecaca",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          disabled={loading || !acceptedTerms}
          onClick={() => void beginCheckout()}
          style={{
            width: "100%",
            minHeight: 56,
            marginTop: 28,
            border: "1px solid #fff1a8",
            borderRadius: 10,
            background: loading || !acceptedTerms
              ? "rgba(255,241,168,0.16)"
              : "#fff1a8",
            color: loading || !acceptedTerms
              ? "#77776f"
              : "#111111",
            padding: "0 22px",
            fontFamily: "Montserrat, sans-serif",
            fontSize: 16,
            fontWeight: 600,
            cursor: loading || !acceptedTerms
              ? "not-allowed"
              : "pointer",
          }}
        >
          {loading
            ? "Abrindo pagamento..."
            : "Assinar Performance AI"}
        </button>

        {paymentState === "processing" ? (
          <button
            type="button"
            onClick={() =>
              router.replace("/performance-ai")
            }
            style={{
              width: "100%",
              minHeight: 48,
              marginTop: 12,
              border:
                "1px solid rgba(255,255,255,0.14)",
              borderRadius: 10,
              background: "transparent",
              color: "#d4d4d8",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Verificar assinatura novamente
          </button>
        ) : null}
      </section>
    </main>
  );
}

const noticeStyle: React.CSSProperties = {
  marginTop: 22,
  padding: "13px 15px",
  border:
    "1px solid rgba(255,241,168,0.22)",
  background:
    "rgba(255,241,168,0.07)",
  color: "#e4e4e7",
  fontSize: 13,
  lineHeight: 1.6,
};

