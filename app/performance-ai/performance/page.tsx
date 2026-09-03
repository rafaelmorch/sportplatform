"use client";

import { useRouter } from "next/navigation";

const performanceItems = [
  {
    title: "Meu Plano",
    href: "/performance-ai/coach/plan",
  },
  {
    title: "Perfil do Atleta",
    href: "/performance-ai/profile",
  },
  {
    title: "Treinamentos",
    href: "/performance-ai/training",
  },
  {
    title: "Corpo",
    href: "/performance-ai/body",
  },
  {
    title: "Saúde",
    href: "/performance-ai/blood",
  },
  {
    title: "Nutrição",
    href: "/performance-ai/nutrition",
  },
];

export default function PerformancePage() {
  const router = useRouter();

  const closePopup = () => {
    router.push("/performance-ai");
  };

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        overflowY: "auto",
        boxSizing: "border-box",
        padding:
          "max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom))",
        background: "rgba(0,0,0,0.82)",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Minha Performance"
        style={{
          position: "relative",
          width: "min(560px, 100%)",
          minHeight: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "38px 10px 28px",
          background: "#050505",
          color: "#ffffff",
        }}
      >
        <button
          type="button"
          aria-label="Fechar Minha Performance"
          onClick={closePopup}
          style={{
            position: "absolute",
            top: 6,
            right: 4,
            width: 40,
            height: 40,
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            color: "#ffffff",
            fontFamily: "Montserrat, sans-serif",
            fontSize: 24,
            fontWeight: 300,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <header
          style={{
            paddingRight: 50,
            paddingBottom: 28,
          }}
        >
          <div
            style={{
              color: "#D4AF37",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.15em",
              lineHeight: 1.4,
              textTransform: "uppercase",
            }}
          >
            Performance AI
          </div>

          <h1
            style={{
              margin: "8px 0 0",
              color: "#ffffff",
              fontSize: "clamp(34px, 8vw, 46px)",
              fontWeight: 400,
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
            }}
          >
            Minha Performance
          </h1>

          <p
            style={{
              margin: "12px 0 0",
              maxWidth: 460,
              color: "rgba(255,255,255,0.46)",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Acesse e atualize seus dados de performance.
          </p>
        </header>

        <nav
          aria-label="Áreas da Minha Performance"
          style={{
            borderTop:
              "1px solid rgba(255,255,255,0.09)",
          }}
        >
          {performanceItems.map((item, index) => {
            const isPlan = index === 0;

            return (
              <button
                key={item.href}
                type="button"
                onClick={() =>
                  router.push(item.href)
                }
                style={{
                  width: "100%",
                  minHeight: 66,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  border: 0,
                  borderBottom:
                    "1px solid rgba(255,255,255,0.09)",
                  background: "transparent",
                  color: "#ffffff",
                  padding: "18px 2px",
                  fontFamily:
                    "Montserrat, sans-serif",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: isPlan ? 600 : 400,
                    lineHeight: 1.4,
                    color: isPlan
                      ? "#D4AF37"
                      : "#ffffff",
                  }}
                >
                  {item.title}
                </span>

                <span
                  aria-hidden="true"
                  style={{
                    color: isPlan
                      ? "#D4AF37"
                      : "rgba(255,255,255,0.48)",
                    fontSize: 20,
                    lineHeight: 1,
                  }}
                >
                  ›
                </span>
              </button>
            );
          })}
        </nav>
      </section>
    </main>
  );
}


