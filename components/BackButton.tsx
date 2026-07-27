"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  label?: string;
  fallbackHref?: string;
};

export default function BackButton({
  label = "Back",
  fallbackHref = "/",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      style={{
        minHeight: 42,
        padding: "0 17px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.72)",
        background: "rgba(15,15,17,0.72)",
        color: "#ffffff",
        fontFamily: "Montserrat, sans-serif",
        fontSize: 13,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "0.01em",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        boxShadow:
          "0 8px 22px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: 19,
          lineHeight: 1,
          transform: "translateY(-1px)",
        }}
      >
        ‹
      </span>

      <span>{label}</span>
    </button>
  );
}
