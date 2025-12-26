"use client";

import { useEffect } from "react";

export default function RegisterPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://pci.jotform.com/jsform/253488541078163";
    script.type = "text/javascript";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "24px",
      }}
    >
      <h1 style={{ marginBottom: "16px" }}>
        Event Registration
      </h1>

      <p style={{ marginBottom: "24px", textAlign: "center" }}>
        Complete the form below to secure your spot.
      </p>

      {/* O formulário do Jotform será injetado aqui */}
      <div id="jotform-container" style={{ width: "100%", maxWidth: "900px" }} />
    </main>
  );
}
