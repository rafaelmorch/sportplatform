/**
 * PLATFORM SPORTS
 * Arquivo: lib/integrations/health-connect.ts
 * Criado em: 2026-08-21 16:30 ET
 * Última alteração: 2026-08-21 16:30 ET
 *
 * Função:
 * Centralizar a integração nativa com Android Health Connect.
 *
 * Responsabilidades:
 * - Verificar disponibilidade.
 * - Solicitar permissões.
 * - Ler atividades com paginação.
 * - Ler métricas de saúde.
 * - Sincronizar dados com /api/health-connect/sync.
 *
 * Este arquivo evita espalhar lógica específica do Health Connect
 * pela interface e prepara a arquitetura para futuros providers.
 *
 * Backup anterior:
 * N/A - arquivo criado nesta data.
 */

import {
  Health,
  type HealthDataType,
} from "@capgo/capacitor-health";

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

const rawMetricTypes: HealthDataType[] = [
  "restingHeartRate",
  "heartRateVariability",
  "vo2Max",
  "sleep",
];

export function isAndroidNative() {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  );
}

export async function checkHealthConnectAvailability() {
  if (!isAndroidNative()) {
    return {
      available: false,
      platform: Capacitor.getPlatform(),
    };
  }

  return Health.isAvailable();
}

export async function authorizeHealthConnect() {
  if (!isAndroidNative()) {
    throw new Error(
      "Health Connect está disponível somente no app Android."
    );
  }

  return Health.requestAuthorization({
    read: readTypes,
    requestHistoryAccess: true,
  });
}

export async function getAllHealthConnectWorkouts(
  startDate: Date,
  endDate: Date
) {
  const workouts: Awaited<
    ReturnType<typeof Health.queryWorkouts>
  >["workouts"] = [];

  let anchor: string | undefined;
  let pageCount = 0;

  do {
    const page = await Health.queryWorkouts({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 100,
      ascending: false,
      anchor,
    });

    workouts.push(...page.workouts);

    anchor = page.anchor;
    pageCount += 1;

    if (pageCount >= 100) {
      throw new Error(
        "Health Connect retornou páginas demais. Sincronização interrompida por segurança."
      );
    }
  } while (anchor);

  const unique = new Map<
    string,
    (typeof workouts)[number]
  >();

  for (const workout of workouts) {
    const key =
      workout.platformId ??
      `${workout.workoutType}-${workout.startDate}-${workout.duration}`;

    unique.set(key, workout);
  }

  return Array.from(unique.values());
}

export async function syncHealthConnect(
  accessToken: string
) {
  if (!isAndroidNative()) {
    throw new Error(
      "Health Connect está disponível somente no app Android."
    );
  }

  const endDate = new Date();

  const workoutStartDate = new Date();
  workoutStartDate.setFullYear(
    workoutStartDate.getFullYear() - 1
  );

  const workouts =
    await getAllHealthConnectWorkouts(
      workoutStartDate,
      endDate
    );

  const metricStartDate = new Date();
  metricStartDate.setDate(
    metricStartDate.getDate() - 30
  );

  const heartRateAggregated =
    await Health.queryAggregated({
      dataType: "heartRate",
      startDate: metricStartDate.toISOString(),
      endDate: endDate.toISOString(),
      bucket: "day",
      aggregation: ["average", "min", "max"],
    });

  const heartRateSamples =
    heartRateAggregated.samples.map((sample) => ({
      dataType: "heartRate",
      value:
        sample.values.average ??
        sample.value,
      unit: sample.unit,
      startDate: sample.startDate,
      endDate: sample.endDate,
      sourceName: "Health Connect",
      sourceId:
        "health_connect_daily_aggregate",
      platformId:
        `aggregate:heartRate:day:${sample.startDate}`,
      aggregationValues:
        sample.values,
    }));

  const rawMetricResults =
    await Promise.all(
      rawMetricTypes.map(
        async (dataType) => {
          const data =
            await Health.readSamples({
              dataType,
              startDate:
                metricStartDate.toISOString(),
              endDate:
                endDate.toISOString(),
              limit: 100,
              ascending: false,
            });

          return data.samples;
        }
      )
    );

  const samples = [
    ...heartRateSamples,
    ...rawMetricResults.flat(),
  ];

  const response = await fetch(
    "/api/health-connect/sync",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        workouts,
        samples,
      }),
    }
  );

  const responseData =
    await response.json();

  if (!response.ok) {
    throw new Error(
      responseData?.error ??
        `Erro HTTP ${response.status}`
    );
  }

  return {
    ...responseData,
    workoutsReadFromHealthConnect:
      workouts.length,
    healthSamplesSent:
      samples.length,
  };
}
