"use client";

import Link from "next/link";
import BackButton from "@/components/BackButton";
import BottomNavbar from "@/components/BottomNavbar";

const activeModules = [
  {
    title: "Body",
    icon: "💪",
    description:
      "Acompanhe peso, IMC, bioimpedância e toda a sua evolução corporal.",
    href: "/performance-ai/body",
    action: "Ver evolução corporal",
  },
  {
    title: "Blood",
    icon: "🩸",
    description:
      "Envie seus exames de sangue, acompanhe marcadores importantes e gere análises com inteligência artificial.",
    href: "/performance-ai/blood",
    action: "Analisar exames",
  },
  {
    title: "Coach IA",
    icon: "🤖",
    description:
      "Receba orientações personalizadas com base nos seus treinos, alimentação, saúde e objetivos.",
    href: "/performance-ai/coach",
    action: "Entrar no Coach IA",
  },
];

const upcomingModules = [
  {
    title: "Training",
    icon: "🏃",
    description:
      "Treinos, atividades, volume, frequência, desempenho e recuperação.",
  },
  {
    title: "Nutrition",
    icon: "🥗",
    description:
      "Refeições, qualidade alimentar, proteínas e orientações nutricionais.",
  },
  {
    title: "Health",
    icon: "❤️",
    description:
      "Exames, histórico clínico e indicadores importantes para sua saúde.",
  },
];

export default function PerformanceAIPage() {
  return (
    <>
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #1f2937 0%, #09090b 42%, #000000 100%)",
          color: "#ffffff",
          padding: "24px 18px 120px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1120,
            margin: "0 auto",
          }}
        >
          <BackButton />

          <section
            style={{
              textAlign: "center",
              padding: "72px 10px 56px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 68,
                height: 68,
                borderRadius: 22,
                background:
                  "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                boxShadow: "0 18px 45px rgba(37, 99, 235, 0.28)",
                fontSize: 32,
                marginBottom: 24,
              }}
            >
              🧠
            </div>

            <p
              style={{
                margin: "0 0 10px",
                color: "#60a5fa",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Sports Platform
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(38px, 7vw, 72px)",
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              Performance AI
            </h1>

            <p
              style={{
                maxWidth: 720,
                margin: "24px auto 0",
                color: "#a1a1aa",
                fontSize: "clamp(17px, 3vw, 21px)",
                lineHeight: 1.65,
              }}
            >
              Seu treinador inteligente para acompanhar sua evolução, entender
              seus dados e orientar suas próximas decisões.
            </p>

            <Link
              href="/performance-ai/coach"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 34,
                minHeight: 54,
                padding: "0 28px",
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 900,
                fontSize: 16,
                boxShadow: "0 16px 40px rgba(37, 99, 235, 0.25)",
              }}
            >
              Entrar no Coach IA →
            </Link>
          </section>

          <section>
            <div
              style={{
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 28,
                  letterSpacing: -0.5,
                }}
              >
                Seus módulos
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#71717a",
                  lineHeight: 1.6,
                }}
              >
                Cada área organiza uma parte importante da sua jornada.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
                gap: 18,
              }}
            >
              {activeModules.map((module) => (
                <Link
                  key={module.title}
                  href={module.href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 260,
                    padding: 28,
                    borderRadius: 24,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background:
                      "linear-gradient(145deg, rgba(24,24,27,0.96), rgba(9,9,11,0.96))",
                    color: "#ffffff",
                    textDecoration: "none",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.24)",
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(59,130,246,0.12)",
                      fontSize: 29,
                    }}
                  >
                    {module.icon}
                  </div>

                  <h3
                    style={{
                      margin: "24px 0 10px",
                      fontSize: 25,
                    }}
                  >
                    {module.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#a1a1aa",
                      lineHeight: 1.65,
                      flex: 1,
                    }}
                  >
                    {module.description}
                  </p>

                  <span
                    style={{
                      marginTop: 24,
                      color: "#60a5fa",
                      fontWeight: 800,
                    }}
                  >
                    {module.action} →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section
            style={{
              marginTop: 58,
            }}
          >
            <div
              style={{
                marginBottom: 22,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 25,
                }}
              >
                Próximos módulos
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#71717a",
                }}
              >
                Novas áreas serão adicionadas gradualmente.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
                gap: 16,
              }}
            >
              {upcomingModules.map((module) => (
                <article
                  key={module.title}
                  style={{
                    padding: 24,
                    borderRadius: 22,
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(24,24,27,0.68)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{module.icon}</span>

                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        color: "#71717a",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                      }}
                    >
                      Em breve
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: "20px 0 9px",
                      fontSize: 21,
                    }}
                  >
                    {module.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#8b8b94",
                      lineHeight: 1.6,
                    }}
                  >
                    {module.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section
            style={{
              marginTop: 58,
              padding: "32px 24px",
              borderRadius: 24,
              textAlign: "center",
              border: "1px solid rgba(96,165,250,0.18)",
              background: "rgba(37,99,235,0.08)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 24,
              }}
            >
              Quanto mais dados, mais inteligente o seu Coach
            </h2>

            <p
              style={{
                maxWidth: 680,
                margin: "12px auto 0",
                color: "#a1a1aa",
                lineHeight: 1.65,
              }}
            >
              Registre sua evolução corporal, seus treinos, sua alimentação e
              seus indicadores de saúde para receber orientações cada vez mais
              personalizadas.
            </p>
          </section>
        </div>
      </main>

      <BottomNavbar />
    </>
  );
}

