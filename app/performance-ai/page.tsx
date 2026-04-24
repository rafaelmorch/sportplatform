"use client";

import BackButton from "@/components/BackButton";
import { useRouter } from "next/navigation";

export default function PerformanceAIHomePage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#0f172a",
        padding: 16,
        paddingBottom: 80,
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <BackButton />
      </div>

      <section
        style={{
          marginTop: 20,
          marginBottom: 28,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: 22,
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            Performance AI
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.05,
            }}
          >
            Seu plano em um só lugar
          </h1>

          <div
            style={{
              fontSize: 15,
              color: "#334155",
              lineHeight: 1.65,
            }}
          >
            Aqui você acompanha treino, alimentação e evolução em um único lugar.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Orientação de alimentação
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#334155",
                  lineHeight: 1.6,
                }}
              >
                Registre refeições e acompanhe sua consistência alimentar.
              </div>
            </div>

            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Orientação de treino
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#334155",
                  lineHeight: 1.6,
                }}
              >
                Veja métricas do Strava, gráfico e sugestões de treino.
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={() => router.push("/performance-ai/profile")}
          style={{
            display: "grid",
            gap: 8,
            textDecoration: "none",
            background: "#0f172a",
            border: "1px solid #0f172a",
            borderRadius: 6,
            padding: 22,
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#cbd5e1",
              fontWeight: 700,
            }}
          >
            Seção 01
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            Meu Perfil
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#cbd5e1",
            }}
          >
            Dados principais, saúde, objetivo e histórico de peso.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div
            onClick={() => router.push("/performance-ai/training")}
            style={{
              display: "grid",
              gap: 8,
              background: "#cbd5e1",
              border: "1px solid #94a3b8",
              borderRadius: 6,
              padding: 20,
              color: "#0f172a",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#475569",
                fontWeight: 700,
              }}
            >
              Seção 02
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              Treino
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#334155",
              }}
            >
              Strava, métricas, histórico e orientação de treino.
            </div>
          </div>

          <div
            onClick={() => router.push("/performance-ai/nutrition")}
            style={{
              display: "grid",
              gap: 8,
              background: "#cbd5e1",
              border: "1px solid #94a3b8",
              borderRadius: 6,
              padding: 20,
              color: "#0f172a",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#475569",
                fontWeight: 700,
              }}
            >
              Seção 03
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              Alimentação
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#334155",
              }}
            >
              Registro de refeições, análise nutricional e sugestões.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
