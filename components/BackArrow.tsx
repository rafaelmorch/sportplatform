"use client";

import { useRouter } from "next/navigation";

export default function BackArrow() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      style={{
        background: "none",
        border: "none",
        fontSize: "20px",
        cursor: "pointer",
      }}
    >
      ←
    </button>
  );
}
