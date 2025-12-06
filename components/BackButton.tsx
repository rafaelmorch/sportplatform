"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "#cbd5e1", // cinza claro
        background: "transparent",
        border: "none",
        fontSize: "15px",
        cursor: "pointer",
        padding: "6px 0",
        transition: "opacity 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <span style={{ fontSize: "20px", lineHeight: "0" }}>←</span>
      Back
    </button>
  );
}
