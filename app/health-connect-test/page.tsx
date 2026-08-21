"use client";

import { useState } from "react";
import { Health } from "@capgo/capacitor-health";
import { Capacitor } from "@capacitor/core";

export default function HealthConnectTestPage() {
  const [result, setResult] = useState("");

  async function checkHealthConnect() {
    try {
      if (!Capacitor.isNativePlatform()) {
        setResult("Abra esta página pelo app Android.");
        return;
      }

      const availability = await Health.isAvailable();

      setResult(JSON.stringify(availability, null, 2));
    } catch (error) {
      setResult(
        error instanceof Error ? error.message : JSON.stringify(error)
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Health Connect Test</h1>

      <button
        onClick={checkHealthConnect}
        style={{
          marginTop: 20,
          padding: "12px 18px",
          fontSize: 16,
        }}
      >
        Verificar Health Connect
      </button>

      <pre
        style={{
          marginTop: 30,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {result}
      </pre>
    </main>
  );
}
