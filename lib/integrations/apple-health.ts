import { Capacitor } from "@capacitor/core";
import { Health } from "@capgo/capacitor-health";

export function isIOSNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

export async function authorizeAppleHealth() {
  if (!isIOSNative()) {
    throw new Error("Apple Health está disponível somente no aplicativo iOS.");
  }

  return Health.requestAuthorization({
    read: ["workouts"],
  });
}

export async function getAppleHealthWorkouts(
  startDate: Date,
  endDate: Date
) {
  if (!isIOSNative()) {
    throw new Error("Apple Health está disponível somente no aplicativo iOS.");
  }

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
    pageCount++;

    if (pageCount >= 100 && anchor) {
      throw new Error("Limite de páginas do Apple Health atingido.");
    }
  } while (anchor);

  const unique = new Map<string, (typeof workouts)[number]>();

  for (const workout of workouts) {
    if (workout.platformId) {
      unique.set(workout.platformId, workout);
    }
  }

  return Array.from(unique.values());
}

export async function syncAppleHealth(accessToken: string) {
  if (!isIOSNative()) {
    throw new Error("Apple Health está disponível somente no aplicativo iOS.");
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const workouts = await getAppleHealthWorkouts(startDate, endDate);

  const response = await fetch("/api/apple-health/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ workouts }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error ?? `Erro HTTP ${response.status}`);
  }

  return {
    ...result,
    workoutsReadFromAppleHealth: workouts.length,
  };
}
