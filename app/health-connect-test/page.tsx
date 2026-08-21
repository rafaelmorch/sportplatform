"use client";

import { useState } from "react";
import { Health, type HealthDataType } from "@capgo/capacitor-health";
import { Capacitor } from "@capacitor/core";

const readTypes: HealthDataType[] = [
  "steps",
  "distance",
  "calories",
  "heartRate",
  "restingHeartRate",
  "heartRateVariability",
  "vo2Max",
  "sleep",
  "workouts",
];

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
      setResult(error instanceof Error ? error.message : JSON.stringify(error));
    }
  }

  async function requestPermissions() {
    try {
      if (!Capacitor.isNativePlatform()) {
        setResult("Abra esta página pelo app Android.");
        return;
      }

      const status = await Health.requestAuthorization({
        read: readTypes,
        requestHistoryAccess: true,
      });

      setResult(JSON.stringify(status, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : JSON.stringify(error));
    }
  }

  async function readWorkouts() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const data = await Health.queryWorkouts({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 20,
        ascending: false,
      });

      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : JSON.stringify(error));
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: "40px 20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Health Connect Test</h1>

      <button onClick={checkHealthConnect} style={{ marginTop: 20, padding: "12px 18px", fontSize: 16 }}>
        Verificar Health Connect
      </button>

      <button onClick={requestPermissions} style={{ display: "block", marginTop: 16, padding: "12px 18px", fontSize: 16 }}>
        Autorizar Health Connect
      </button>

      <button onClick={readWorkouts} style={{ display: "block", marginTop: 16, padding: "12px 18px", fontSize: 16 }}>
        Ler atividades
      </button>

      <pre style={{ marginTop: 30, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {result}
      </pre>
    </main>
  );
}

