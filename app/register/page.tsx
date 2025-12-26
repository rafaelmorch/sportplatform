"use client";

import { useEffect, useRef } from "react";

export default function RegisterPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://pci.jotform.com/jsform/253488541078163";
    script.type = "text/javascript";
    script.async = true;

    containerRef.current.appendChild(script);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff",
        padding: 0,
        margin: 0,
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          background: "#fff",
        }}
      />
    </main>
  );
}
