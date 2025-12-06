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
        color: "#e5e7eb",
        background: "transparent",
        border: "none",
        fontSize: "14px",
        cursor: "pointer",
        padding: "8px 0",
      }}
    >
      <span style={{ fontSize: "18px" }}>←</span>
      Voltar
    </button>
  );
}
