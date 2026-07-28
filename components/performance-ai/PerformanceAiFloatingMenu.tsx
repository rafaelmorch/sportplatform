"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PerformanceAiFloatingMenu() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const openPage = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 78,
            border: 0,
            padding: 0,
            background: "rgba(0,0,0,0.18)",
            cursor: "default",
          }}
        />
      )}

      {menuOpen && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Menu do Performance AI"
          style={sheetStyle}
        >
          <button
            type="button"
            onClick={() => openPage("/performance-ai/chat")}
            style={sheetOptionStyle}
          >
            Conversar com o Coach
          </button>

          <button
            type="button"
            onClick={() => openPage("/performance-ai/performance")}
            style={sheetOptionStyle}
          >
            Minha Performance
          </button>
        </section>
      )}

      <button
        type="button"
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        onClick={() => setMenuOpen((current) => !current)}
        style={{
          position: "fixed",
          right: 18,
          bottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
          zIndex: 80,
          width: 58,
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: "1px solid #15803d",
          background: "#16a34a",
          boxShadow: "0 14px 32px rgba(0,0,0,0.42)",
          color: "#ffffff",
          fontFamily: "Montserrat, sans-serif",
          fontSize: 34,
          fontWeight: 400,
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        {menuOpen ? "×" : "+"}
      </button>
    </>
  );
}

const sheetStyle: React.CSSProperties = {
  position: "fixed",
  right: 18,
  bottom: "calc(156px + env(safe-area-inset-bottom, 0px))",
  zIndex: 79,
  width: "min(250px, calc(100vw - 36px))",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 7,
  padding: 0,
  border: 0,
  borderRadius: 0,
  background: "transparent",
  boxShadow: "none",
  fontFamily: "Montserrat, sans-serif",
};

const sheetOptionStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 11,
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 3px 10px rgba(0,0,0,0.07)",
  color: "#18181b",
  padding: "9px 13px",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.3,
  textAlign: "left",
  cursor: "pointer",
};

