"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header
      style={{
        width: "100%",
        background: "#020617",
        borderBottom: "1px solid #1f2933",
        paddingTop: "calc(env(safe-area-inset-top) + 10px)",
        paddingLeft: 12,
        paddingRight: 12,
        paddingBottom: 10,
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <nav
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 14,
          fontSize: 13,
          boxSizing: "border-box",
          flexWrap: "wrap",
        }}
      >
        <Link href="/privacy" style={{ color: "#e5e7eb", textDecoration: "none" }}>
          Privacy
        </Link>

        <Link href="/terms" style={{ color: "#e5e7eb", textDecoration: "none" }}>
          Terms
        </Link>
      </nav>
    </header>
  );
}
