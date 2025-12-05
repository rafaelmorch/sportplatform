// components/LoginTopMenu.tsx
"use client";

import Link from "next/link";

export default function LoginTopMenu() {
  console.log("LoginTopMenu RENDERIZADO"); // só pra testar no console

  return (
    <nav
      style={{
        width: "100%",
        borderBottom: "1px solid rgba(148,163,184,0.3)",
        background: "rgba(15,23,42,0.96)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo / Nome */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#e5e7eb",
            letterSpacing: 0.5,
          }}
        >
          SportPlatform
        </div>

        {/* Links */}
        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 13,
          }}
        >
          <Link
            href="/about"
            style={{ color: "#e5e7eb", textDecoration: "none" }}
          >
            About
          </Link>
          <Link
            href="/garmin-privacy"
            style={{ color: "#e5e7eb", textDecoration: "none" }}
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </nav>
  );
}
