"use client";

import { useRouter } from "next/navigation";

const performanceItems = [
  {
    title: "Meu Plano",
    href: "/performance-ai/coach",
    icon: "",
  },
  {
    title: "Perfil do Atleta",
    href: "/performance-ai/profile",
    icon: "",
  },
  {
    title: "Treinamentos",
    href: "/performance-ai/training",
    icon: "",
  },
  {
    title: "Corpo",
    href: "/performance-ai/body",
    icon: "",
  },
  {
    title: "Saúde",
    href: "/performance-ai/blood",
    icon: "",
  },
  {
    title: "Nutrição",
    href: "/performance-ai/nutrition",
    icon: "",
  },
];

export default function PerformancePage() {
  const router = useRouter();

  const closePopup = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/performance-ai");
  };

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding:
          "max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))",
        background: "rgba(0,0,0,0.72)",
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
          maxHeight:
            "calc(100dvh - max(32px, env(safe-area-inset-top) + env(safe-area-inset-bottom)))",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: "34px 20px 24px",
          border: "1px solid rgba(255,241,168,0.15)",
          borderRadius: 18,
          background: "#050505",
          boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
        }}
      >
        <button
          type="button"
          aria-label="Fechar Minha Performance"
          onClick={closePopup}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 42,
            height: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,241,168,0.12)",
            borderRadius: "50%",
            background: "#18181B",
            color: "#ffffff",
            fontFamily: "Montserrat, sans-serif",
            fontSize: 27,
            fontWeight: 400,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div
          style={{
            paddingRight: 52,
          }}
        >
          <div
            style={{
              color: "#FFF1A8",
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: "0.12em",
              lineHeight: 1.4,
              textTransform: "uppercase",
            }}
          >
            Performance AI
          </div>

          <h1
            style={{
              margin: "10px 0 0",
              color: "#ffffff",
              fontSize: "clamp(30px, 7vw, 42px)",
              fontWeight: 780,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
            }}
          >
            Minha Performance
          </h1>

          <p
            style={{
              margin: "14px 0 0",
              color: "#d4d4d8",
              fontSize: 18,
              lineHeight: 1.65,
            }}
          >
            Acesse e atualize seus dados de performance.
          </p>
        </div>

        <div
          style={{
            marginTop: 30,
            display: "grid",
            gap: 10,
          }}
        >
          {performanceItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              style={{
                width: "100%",
                minHeight: 66,
                display: "flex",
                alignItems: "center",
                gap: 0,
                border: "1px solid rgba(255,241,168,0.12)",
                borderRadius: 13,
                background: "#18181B",
                color: "#ffffff",
                padding: "12px 15px",
                fontFamily: "Montserrat, sans-serif",
                textAlign: "left",
                cursor: "pointer",
              }}
            >

              <span
                style={{
                  flex: 1,
                  fontSize: 18,
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}
              >
                {item.title}
              </span>

              <span
                aria-hidden="true"
                style={{
                  color: "#FFF1A8",
                  fontSize: 22,
                  lineHeight: 1,
                }}
              >
                ›
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}




