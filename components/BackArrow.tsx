"use client";

import { useRouter } from "next/navigation";

type BackArrowProps = {
  href?: string;
  label?: string;
};

export default function BackArrow({ href, label }: BackArrowProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (href) {
          router.push(href);
          return;
        }

        router.back();
      }}
      style={{
        background: "none",
        border: "none",
        fontSize: "20px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
      aria-label={label || "Go back"}
      type="button"
    >
      <span>←</span>
      {label ? <span style={{ fontSize: 14 }}>{label}</span> : null}
    </button>
  );
}
