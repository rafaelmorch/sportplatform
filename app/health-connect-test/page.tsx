/**
 * PLATFORM SPORTS
 * Arquivo: app/health-connect-test/page.tsx
 * Criado em: 2026-08-21
 * Última alteração: 2026-08-21 15:36 ET
 *
 * Função:
 * Testar autorização, leitura e sincronização do Android Health Connect
 * com a Platform Sports / Supabase.
 *
 * Backup anterior:
 * app/health-connect-test/page-BACKUP-2026-08-21-1536.tsx
 */

"use client";

import { useState } from "react";
import { Health, type HealthDataType } from "@capgo/capacitor-health";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

const healthMetricTypes: HealthDataType[] = [
  "heartRate",
  "restingHeartRate",
  "heartRateVariability",
  "vo2Max",
  "sleep",
];

export default function HealthConnectTestPage() {
  const [result, setResult] = useState("");
  const [syncing, setSyncing] = useState(false);

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
      startDate.setFullYear(startDate.getFullYear() - 1);

      const data = await Health.queryWorkouts({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      });

      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : JSON.stringify(error));
    }
  }

  async function readHealthData() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const results = await Promise.all(
        healthMetricTypes.map(async (dataType) => {
          const data = await Health.readSamples({
            dataType,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: 100,
            ascending: false,
          });

          return {
            dataType,
            count: data.samples.length,
            sample: data.samples[0] ?? null,
          };
        })
      );

      setResult(JSON.stringify(results, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : JSON.stringify(error));
    }
  }

  async function syncHealthConnect() {
    try {
      setSyncing(true);
      setResult("Sincronizando Health Connect...");

      if (!Capacitor.isNativePlatform()) {
        throw new Error("Abra esta página pelo app Android.");
      }

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const endDate = new Date();

      const workoutStartDate = new Date();
      workoutStartDate.setFullYear(
        workoutStartDate.getFullYear() - 1
      );

      const workoutData = await Health.queryWorkouts({
        startDate: workoutStartDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      });

      const metricStartDate = new Date();
      metricStartDate.setDate(
        metricStartDate.getDate() - 30
      );

      const metricResults = await Promise.all(
        healthMetricTypes.map(async (dataType) => {
          const data = await Health.readSamples({
            dataType,
            startDate: metricStartDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: 100,
            ascending: false,
          });

          return data.samples;
        })
      );

      const samples = metricResults.flat();

      const response = await fetch(
        "/api/health-connect/sync",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            workouts: workoutData.workouts,
            samples,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData?.error ??
            `Erro HTTP ${response.status}`
        );
      }

      setResult(
        JSON.stringify(
          {
            ...responseData,
            message:
              "Health Connect sincronizado com a Platform Sports.",
          },
          null,
          2
        )
      );
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : JSON.stringify(error)
      );
    } finally {
      setSyncing(false);
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

      <button
        onClick={requestPermissions}
        style={{
          display: "block",
          marginTop: 16,
          padding: "12px 18px",
          fontSize: 16,
        }}
      >
        Autorizar Health Connect
      </button>

      <button
        onClick={readWorkouts}
        style={{
          display: "block",
          marginTop: 16,
          padding: "12px 18px",
          fontSize: 16,
        }}
      >
        Ler atividades
      </button>

      <button
        onClick={readHealthData}
        style={{
          display: "block",
          marginTop: 16,
          padding: "12px 18px",
          fontSize: 16,
        }}
      >
        Ler dados de saúde
      </button>

      <button
        onClick={syncHealthConnect}
        disabled={syncing}
        style={{
          display: "block",
          marginTop: 16,
          padding: "12px 18px",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {syncing
          ? "Sincronizando..."
          : "Sincronizar com Platform Sports"}
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
