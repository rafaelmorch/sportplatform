"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.replace("/activities");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily: "Montserrat, Arial, sans-serif",
        color: "#64748b",
        fontSize: 14,
      }}
    >
      Loading...
    </main>
  );
}
