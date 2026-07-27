"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

type PerformanceAiBackButtonProps = {
  href?: string;
};

export default function PerformanceAiBackButton({
  href = "/performance-ai",
}: PerformanceAiBackButtonProps) {
  return (
    <Link
      href={href}
      aria-label="Voltar para Performance AI"
      style={styles.button}
    >
      <span aria-hidden="true" style={styles.arrow}>
        ←
      </span>

      <span>Performance AI</span>
    </Link>
  );
}

const styles: Record<string, CSSProperties> = {
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    minHeight: 44,
    boxSizing: "border-box",
    padding: "8px 2px",
    color: "#f4f4f5",
    fontFamily: "Montserrat, sans-serif",
    fontSize: 14,
    fontWeight: 750,
    lineHeight: 1,
    textDecoration: "none",
    WebkitTapHighlightColor: "transparent",
  },

  arrow: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#d4af37",
    fontSize: 23,
    fontWeight: 500,
    lineHeight: 1,
  },
};
