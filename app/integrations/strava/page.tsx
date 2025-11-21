// app/integrations/strava/page.tsx
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportplatform.app";
const clientId = process.env.STRAVA_CLIENT_ID;

const redirectUri = `${siteUrl}/api/strava/callback`;

const authorizeUrl = `https://www.strava.com/oauth/authorize` +
  `?client_id=${clientId}` +
  `&response_type=code` +
  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
  `&approval_prompt=auto` +
  `&scope=read,activity:read_all`;

export default function StravaIntegrationPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "560px",
          borderRadius: "24px",
          padding: "32px 28px",
          background:
            "radial-gradient(circle at top, #020617, #020617 40%, #000000 100%)",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          boxShadow:
            "0 18px 45px rgba(15, 23, 42, 0.8), 0 0 0 1px rgba(15, 23, 42, 0.9)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "999px",
              background:
                "radial-gradient(circle at 20% 20%, #16a34a, #22c55e 40%, #0f172a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 700,
              color: "#0b1120",
            }}
          >
            SP
          </div>
          <div>
            <p
              style={{
                fontSize: "13px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#64748b",
                margin: 0,
              }}
            >
              Integrações
            </p>
            <h1
              style={{
                fontSize: "24px",
                margin: 0,
                color: "#e5e7eb",
              }}
            >
              Conectar Strava
            </h1>
          </div>
        </div>

        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#cbd5f5",
            marginBottom: "22px",
          }}
        >
          Conecte sua conta do Strava ao SportPlatform para visualizar seu
          histórico de atividades, métricas e dashboards personalizados em um
          só lugar.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "26px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              fontSize: "13px",
              color: "#94a3b8",
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "999px",
                border: "1px solid rgba(34,197,94,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "#22c55e",
              }}
            >
              1
            </span>
            <span>Você será redirecionado para o Strava para autorizar o acesso.</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              fontSize: "13px",
              color: "#94a3b8",
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "999px",
                border: "1px solid rgba(34,197,94,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "#22c55e",
              }}
            >
              2
            </span>
            <span>Após autorizar, voltará automaticamente para o SportPlatform.</span>
          </div>
        </div>

        <a
          href={authorizeUrl}
          style={{
            display: "inline-flex",
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            height: 48,
            borderRadius: "999px",
            background:
              "linear-gradient(135deg, #fb923c 0%, #f97316 40%, #ea580c 100%)",
            color: "#0b1120",
            fontWeight: 600,
            fontSize: "15px",
            border: "1px solid rgba(248, 250, 252, 0.08)",
            textDecoration: "none",
            boxShadow:
              "0 12px 35px rgba(15, 23, 42, 0.8), 0 0 0 1px rgba(15, 23, 42, 0.9)",
          }}
        >
          Conectar com Strava
        </a>

        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              fontSize: "13px",
              color: "#9ca3af",
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            Voltar ao dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
