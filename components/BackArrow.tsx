"use client";

import { useRouter } from "next/navigation";

type BackArrowProps = {
  href?: string;
  label?: string;
  onClick?: () => void;
};

export default function BackArrow({
  href,
  label,
  onClick,
}: BackArrowProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }

        if (href) {
          router.push(href);
          return;
        }

        router.back();
      }}
      style={{
        height: 36,
        padding: "0 12px",
        borderRadius: 999,
        border: "1px solid #cbd5e1",
        background: "#ffffff",
        color: "#0f172a",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: "0.02em",
        boxShadow: "0 4px 10px rgba(15,23,42,0.12)",
        whiteSpace: "nowrap",
        fontFamily: "Montserrat, sans-serif",
      }}
      aria-label={label || "Go back"}
      type="button"
    >
      <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>←</span>
      <span>Back</span>
      {label ? <span>{label}</span> : null}
    </button>
  );
}

