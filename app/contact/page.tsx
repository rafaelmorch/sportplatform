"use client";

import { useEffect, useRef } from "react";

export default function ContactPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://form.jotform.com/jsform/253594326585064";
    script.type = "text/javascript";
    script.async = true;

    containerRef.current.appendChild(script);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        padding: "24px 16px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: "720px",
          background: "#fff",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      />
    </main>
  );
}
