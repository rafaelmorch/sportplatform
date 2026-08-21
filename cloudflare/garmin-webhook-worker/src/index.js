const MAX_INLINE_PROCESSING_BYTES = 8 * 1024 * 1024;

function eventTypeFromKey(key) {
  if (key.startsWith("activities/")) return "activity";
  if (key.startsWith("dailies/")) return "daily";
  if (key.startsWith("sleeps/")) return "sleep";
  if (key.startsWith("hrv/")) return "hrv";
  if (key.startsWith("permissions/")) return "permissions";
  if (key.startsWith("deregistrations/")) return "deregistration";
  return null;
}

function supabaseHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function insertWebhookEvents(env, rows) {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/garmin_webhook_events`,
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(env),
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status === 409) {
      try {
        const parsed = JSON.parse(errorText);

        if (parsed?.code === "23505") {
          console.log("Duplicate Garmin event ignored.");
          return;
        }
      } catch {
        // Fall through.
      }
    }

    throw new Error(
      `Supabase webhook insert failed (${response.status}): ${errorText}`
    );
  }
}

async function getAppUserId(env, garminUserId) {
  if (!garminUserId) return null;

  const url =
    `${env.SUPABASE_URL}/rest/v1/garmin_connections` +
    `?garmin_user_id=eq.${encodeURIComponent(garminUserId)}` +
    `&select=user_id&limit=1`;

  const response = await fetch(url, {
    method: "GET",
    headers: supabaseHeaders(env),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Garmin connection lookup failed (${response.status}): ${errorText}`
    );
  }

  const rows = await response.json();

  return rows?.[0]?.user_id ?? null;
}

async function insertImportedActivity(
  env,
  appUserId,
  externalId,
  item
) {
  const row = {
    user_id: appUserId,
    provider: "garmin",
    external_id: externalId,

    device_name:
      typeof item?.deviceName === "string"
        ? item.deviceName.trim()
        : null,

    name:
      typeof item?.activityName === "string"
        ? item.activityName
        : null,

    sport_type:
      typeof item?.activityType === "string"
        ? item.activityType
        : null,

    start_date:
      item?.startTimeInSeconds != null
        ? new Date(
            Number(item.startTimeInSeconds) * 1000
          ).toISOString()
        : null,

    distance_m:
      item?.distanceInMeters != null
        ? Number(item.distanceInMeters)
        : null,

    moving_time_s:
      item?.durationInSeconds != null
        ? Math.round(Number(item.durationInSeconds))
        : null,

    elapsed_time_s:
      item?.durationInSeconds != null
        ? Math.round(Number(item.durationInSeconds))
        : null,

    avg_speed_ms:
      item?.averageSpeedInMetersPerSecond != null
        ? Number(item.averageSpeedInMetersPerSecond)
        : null,

    max_speed_ms:
      item?.maxSpeedInMetersPerSecond != null
        ? Number(item.maxSpeedInMetersPerSecond)
        : null,

    avg_heartrate:
      item?.averageHeartRateInBeatsPerMinute != null
        ? Number(item.averageHeartRateInBeatsPerMinute)
        : null,

    max_heartrate:
      item?.maxHeartRateInBeatsPerMinute != null
        ? Number(item.maxHeartRateInBeatsPerMinute)
        : null,

    calories:
      item?.activeKilocalories != null
        ? Number(item.activeKilocalories)
        : null,

    has_heartrate:
      item?.averageHeartRateInBeatsPerMinute != null ||
      item?.maxHeartRateInBeatsPerMinute != null,

    raw_activity: item,
  };

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/imported_activities?on_conflict=provider,external_id`,
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(env),
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Imported activity insert failed (${response.status}): ${errorText}`
    );
  }
}

async function updateWebhookEvent(
  env,
  garminUserId,
  externalId,
  values
) {
  const url =
    `${env.SUPABASE_URL}/rest/v1/garmin_webhook_events` +
    `?event_type=eq.activity` +
    `&garmin_user_id=eq.${encodeURIComponent(garminUserId)}` +
    `&external_id=eq.${encodeURIComponent(externalId)}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(env),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Webhook event update failed (${response.status}): ${errorText}`
    );
  }
}

async function processActivityItem(
  env,
  item,
  externalId
) {
  const garminUserId =
    typeof item?.userId === "string"
      ? item.userId
      : null;

  if (!garminUserId) {
    console.log(
      `Garmin activity ${externalId} has no userId; left pending.`
    );
    return;
  }

  const appUserId =
    await getAppUserId(env, garminUserId);

  if (!appUserId) {
    console.log(
      `No Platform Sports user linked to Garmin user ${garminUserId}; activity ${externalId} left pending.`
    );
    return;
  }

  try {
    await insertImportedActivity(
      env,
      appUserId,
      externalId,
      item
    );

    await updateWebhookEvent(
      env,
      garminUserId,
      externalId,
      {
        app_user_id: appUserId,
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        processing_error: null,
      }
    );

    console.log(
      `Garmin activity auto-imported: ${externalId}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    try {
      await updateWebhookEvent(
        env,
        garminUserId,
        externalId,
        {
          app_user_id: appUserId,
          processing_status: "error",
          processed_at: new Date().toISOString(),
          processing_error: errorMessage,
        }
      );
    } catch (updateError) {
      console.error(
        "Failed to save Garmin processing error:",
        updateError
      );
    }

    throw error;
  }
}

async function upsertHealthDailySummary(
  env,
  appUserId,
  externalId,
  item
) {
  let day = null;

  if (
    typeof item?.calendarDate === "string" &&
    item.calendarDate
  ) {
    day = item.calendarDate;
  } else if (item?.startTimeInSeconds != null) {
    day = new Date(
      Number(item.startTimeInSeconds) * 1000
    )
      .toISOString()
      .slice(0, 10);
  }

  if (!day) {
    throw new Error(
      `Garmin Daily ${externalId} has no calendar date.`
    );
  }

  const row = {
    user_id: appUserId,
    provider: "garmin",
    external_id: externalId,
    day,

    steps:
      item?.steps != null
        ? Number(item.steps)
        : null,

    steps_goal:
      item?.stepsGoal != null
        ? Number(item.stepsGoal)
        : null,

    distance_m:
      item?.distanceInMeters != null
        ? Number(item.distanceInMeters)
        : null,

    active_calories:
      item?.activeKilocalories != null
        ? Number(item.activeKilocalories)
        : null,

    bmr_calories:
      item?.bmrKilocalories != null
        ? Number(item.bmrKilocalories)
        : null,

    resting_heart_rate:
      item?.restingHeartRateInBeatsPerMinute != null
        ? Number(item.restingHeartRateInBeatsPerMinute)
        : null,

    average_heart_rate:
      item?.averageHeartRateInBeatsPerMinute != null
        ? Number(item.averageHeartRateInBeatsPerMinute)
        : null,

    min_heart_rate:
      item?.minHeartRateInBeatsPerMinute != null
        ? Number(item.minHeartRateInBeatsPerMinute)
        : null,

    max_heart_rate:
      item?.maxHeartRateInBeatsPerMinute != null
        ? Number(item.maxHeartRateInBeatsPerMinute)
        : null,

    average_stress:
      item?.averageStressLevel != null
        ? Number(item.averageStressLevel)
        : null,

    max_stress:
      item?.maxStressLevel != null
        ? Number(item.maxStressLevel)
        : null,

    stress_duration_s:
      item?.stressDurationInSeconds != null
        ? Number(item.stressDurationInSeconds)
        : null,

    body_battery_charged:
      item?.bodyBatteryChargedValue != null
        ? Number(item.bodyBatteryChargedValue)
        : null,

    body_battery_drained:
      item?.bodyBatteryDrainedValue != null
        ? Number(item.bodyBatteryDrainedValue)
        : null,

    active_time_s:
      item?.activeTimeInSeconds != null
        ? Number(item.activeTimeInSeconds)
        : null,

    moderate_intensity_s:
      item?.moderateIntensityDurationInSeconds != null
        ? Number(item.moderateIntensityDurationInSeconds)
        : null,

    vigorous_intensity_s:
      item?.vigorousIntensityDurationInSeconds != null
        ? Number(item.vigorousIntensityDurationInSeconds)
        : null,

    floors_climbed:
      item?.floorsClimbed != null
        ? Number(item.floorsClimbed)
        : null,

    raw: item,
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/health_daily_summaries?on_conflict=user_id,provider,day`,
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(env),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Health Daily upsert failed (${response.status}): ${errorText}`
    );
  }
}

async function updateDailyWebhookEvent(
  env,
  garminUserId,
  externalId,
  values
) {
  const url =
    `${env.SUPABASE_URL}/rest/v1/garmin_webhook_events` +
    `?event_type=eq.daily` +
    `&garmin_user_id=eq.${encodeURIComponent(garminUserId)}` +
    `&external_id=eq.${encodeURIComponent(externalId)}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(env),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Daily webhook event update failed (${response.status}): ${errorText}`
    );
  }
}

async function processDailyItem(
  env,
  item,
  externalId
) {
  const garminUserId =
    typeof item?.userId === "string"
      ? item.userId
      : null;

  if (!garminUserId) {
    console.log(
      `Garmin Daily ${externalId} has no userId; left pending.`
    );
    return;
  }

  const appUserId =
    await getAppUserId(env, garminUserId);

  if (!appUserId) {
    console.log(
      `No Platform Sports user linked to Garmin user ${garminUserId}; Daily ${externalId} left pending.`
    );
    return;
  }

  try {
    await upsertHealthDailySummary(
      env,
      appUserId,
      externalId,
      item
    );

    await updateDailyWebhookEvent(
      env,
      garminUserId,
      externalId,
      {
        app_user_id: appUserId,
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        processing_error: null,
      }
    );

    console.log(
      `Garmin Daily auto-imported: ${externalId}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    try {
      await updateDailyWebhookEvent(
        env,
        garminUserId,
        externalId,
        {
          app_user_id: appUserId,
          processing_status: "error",
          processed_at: new Date().toISOString(),
          processing_error: errorMessage,
        }
      );
    } catch (updateError) {
      console.error(
        "Failed to save Garmin Daily processing error:",
        updateError
      );
    }

    throw error;
  }
}
async function upsertHealthHrvSummary(
  env,
  appUserId,
  externalId,
  item
) {
  const day =
    typeof item?.calendarDate === "string"
      ? item.calendarDate
      : null;

  if (!day) {
    throw new Error(
      `Garmin HRV ${externalId} has no calendarDate.`
    );
  }

  const row = {
    user_id: appUserId,
    provider: "garmin",
    external_id: externalId,
    day,

    last_night_avg:
      item?.lastNightAvg != null
        ? Number(item.lastNightAvg)
        : null,

    last_night_5min_high:
      item?.lastNight5MinHigh != null
        ? Number(item.lastNight5MinHigh)
        : null,

    duration_s:
      item?.durationInSeconds != null
        ? Number(item.durationInSeconds)
        : null,

    hrv_readings:
      item?.hrvReadings != null
        ? item.hrvReadings
        : null,

    raw: item,
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/health_hrv_summaries?on_conflict=user_id,provider,day`,
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(env),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Health HRV upsert failed (${response.status}): ${errorText}`
    );
  }
}

async function updateHrvWebhookEvent(
  env,
  garminUserId,
  externalId,
  values
) {
  const url =
    `${env.SUPABASE_URL}/rest/v1/garmin_webhook_events` +
    `?event_type=eq.hrv` +
    `&garmin_user_id=eq.${encodeURIComponent(garminUserId)}` +
    `&external_id=eq.${encodeURIComponent(externalId)}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(env),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `HRV webhook update failed (${response.status}): ${errorText}`
    );
  }
}

async function processHrvItem(
  env,
  item,
  externalId
) {
  const garminUserId =
    typeof item?.userId === "string"
      ? item.userId
      : null;

  if (!garminUserId) {
    console.log(
      `Garmin HRV ${externalId} has no userId; left pending.`
    );
    return;
  }

  const appUserId =
    await getAppUserId(env, garminUserId);

  if (!appUserId) {
    console.log(
      `No Platform Sports user linked to Garmin user ${garminUserId}; HRV ${externalId} left pending.`
    );
    return;
  }

  try {
    await upsertHealthHrvSummary(
      env,
      appUserId,
      externalId,
      item
    );

    await updateHrvWebhookEvent(
      env,
      garminUserId,
      externalId,
      {
        app_user_id: appUserId,
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        processing_error: null,
      }
    );

    console.log(
      `Garmin HRV auto-imported: ${externalId}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    try {
      await updateHrvWebhookEvent(
        env,
        garminUserId,
        externalId,
        {
          app_user_id: appUserId,
          processing_status: "error",
          processed_at: new Date().toISOString(),
          processing_error: errorMessage,
        }
      );
    } catch (updateError) {
      console.error(
        "Failed to save Garmin HRV processing error:",
        updateError
      );
    }

    throw error;
  }
}
async function upsertHealthSleepSummary(
  env,
  appUserId,
  externalId,
  item
) {
  const day =
    typeof item?.calendarDate === "string"
      ? item.calendarDate
      : null;

  if (!day) {
    throw new Error(
      `Garmin Sleep ${externalId} has no calendarDate.`
    );
  }

  const sleepStart =
    item?.startTimeInSeconds != null
      ? new Date(
          Number(item.startTimeInSeconds) * 1000
        ).toISOString()
      : null;

  const sleepScore =
    item?.overallSleepScore?.value != null
      ? Number(item.overallSleepScore.value)
      : null;

  const sleepScoreQualifier =
    typeof item?.overallSleepScore?.qualifierKey === "string"
      ? item.overallSleepScore.qualifierKey
      : null;

  const row = {
    user_id: appUserId,
    provider: "garmin",
    external_id: externalId,
    day,

    sleep_start: sleepStart,

    sleep_duration_s:
      item?.durationInSeconds != null
        ? Number(item.durationInSeconds)
        : null,

    deep_sleep_s:
      item?.deepSleepDurationInSeconds != null
        ? Number(item.deepSleepDurationInSeconds)
        : null,

    light_sleep_s:
      item?.lightSleepDurationInSeconds != null
        ? Number(item.lightSleepDurationInSeconds)
        : null,

    rem_sleep_s:
      item?.remSleepInSeconds != null
        ? Number(item.remSleepInSeconds)
        : null,

    awake_s:
      item?.awakeDurationInSeconds != null
        ? Number(item.awakeDurationInSeconds)
        : null,

    nap_duration_s:
      item?.totalNapDurationInSeconds != null
        ? Number(item.totalNapDurationInSeconds)
        : null,

    sleep_score: sleepScore,
    sleep_score_qualifier: sleepScoreQualifier,

    raw: item,
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/health_sleep_summaries?on_conflict=user_id,provider,day`,
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(env),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Health Sleep upsert failed (${response.status}): ${errorText}`
    );
  }
}

async function updateSleepWebhookEvent(
  env,
  garminUserId,
  externalId,
  values
) {
  const url =
    `${env.SUPABASE_URL}/rest/v1/garmin_webhook_events` +
    `?event_type=eq.sleep` +
    `&garmin_user_id=eq.${encodeURIComponent(garminUserId)}` +
    `&external_id=eq.${encodeURIComponent(externalId)}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(env),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Sleep webhook update failed (${response.status}): ${errorText}`
    );
  }
}

async function processSleepItem(
  env,
  item,
  externalId
) {
  const garminUserId =
    typeof item?.userId === "string"
      ? item.userId
      : null;

  if (!garminUserId) {
    console.log(
      `Garmin Sleep ${externalId} has no userId; left pending.`
    );
    return;
  }

  const appUserId =
    await getAppUserId(env, garminUserId);

  if (!appUserId) {
    console.log(
      `No Platform Sports user linked to Garmin user ${garminUserId}; Sleep ${externalId} left pending.`
    );
    return;
  }

  try {
    await upsertHealthSleepSummary(
      env,
      appUserId,
      externalId,
      item
    );

    await updateSleepWebhookEvent(
      env,
      garminUserId,
      externalId,
      {
        app_user_id: appUserId,
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        processing_error: null,
      }
    );

    console.log(
      `Garmin Sleep auto-imported: ${externalId}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    try {
      await updateSleepWebhookEvent(
        env,
        garminUserId,
        externalId,
        {
          app_user_id: appUserId,
          processing_status: "error",
          processed_at: new Date().toISOString(),
          processing_error: errorMessage,
        }
      );
    } catch (updateError) {
      console.error(
        "Failed to save Garmin Sleep processing error:",
        updateError
      );
    }

    throw error;
  }
}

async function deleteSupabaseRows(
  env,
  table,
  filters
) {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/${table}?${filters}`,
    {
      method: "DELETE",
      headers: {
        ...supabaseHeaders(env),
        Prefer: "return=minimal",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Delete from ${table} failed (${response.status}): ${errorText}`
    );
  }
}

async function getGarminWebhookR2Keys(
  env,
  garminUserId
) {
  const url =
    `${env.SUPABASE_URL}/rest/v1/garmin_webhook_events` +
    `?garmin_user_id=eq.${encodeURIComponent(garminUserId)}` +
    `&select=payload`;

  const response = await fetch(url, {
    method: "GET",
    headers: supabaseHeaders(env),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Garmin webhook lookup failed (${response.status}): ${errorText}`
    );
  }

  const rows = await response.json();
  const keys = new Set();

  for (const row of rows) {
    const key = row?.payload?._r2_key;

    if (typeof key === "string" && key) {
      keys.add(key);
    }
  }

  return [...keys];
}

async function updateDeregistrationWebhookEvent(
  env,
  garminUserId,
  externalId,
  values
) {
  const url =
    `${env.SUPABASE_URL}/rest/v1/garmin_webhook_events` +
    `?event_type=eq.deregistration` +
    `&garmin_user_id=eq.${encodeURIComponent(garminUserId)}` +
    `&external_id=eq.${encodeURIComponent(externalId)}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(env),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Deregistration webhook update failed (${response.status}): ${errorText}`
    );
  }
}

async function processDeregistrationItem(
  env,
  item,
  externalId
) {
  const garminUserId =
    typeof item?.userId === "string"
      ? item.userId
      : null;

  if (!garminUserId) {
    console.log(
      `Garmin deregistration ${externalId} has no userId; left pending.`
    );
    return;
  }

  const appUserId =
    await getAppUserId(env, garminUserId);

  if (!appUserId) {
    console.log(
      `No Platform Sports user linked to Garmin user ${garminUserId}; deregistration ${externalId} left pending.`
    );
    return;
  }

  try {
    const userFilter =
      `user_id=eq.${encodeURIComponent(appUserId)}` +
      `&provider=eq.garmin`;

    await deleteSupabaseRows(
      env,
      "imported_activities",
      userFilter
    );

    await deleteSupabaseRows(
      env,
      "health_daily_summaries",
      userFilter
    );

    await deleteSupabaseRows(
      env,
      "health_sleep_summaries",
      userFilter
    );

    const r2Keys =
      await getGarminWebhookR2Keys(
        env,
        garminUserId
      );

    for (const key of r2Keys) {
      await env.GARMIN_INBOX.delete(key);
    }

    const previousEventsFilter =
      `garmin_user_id=eq.${encodeURIComponent(garminUserId)}` +
      `&external_id=neq.${encodeURIComponent(externalId)}`;

    await deleteSupabaseRows(
      env,
      "garmin_webhook_events",
      previousEventsFilter
    );

    if (typeof item?._r2_key === "string") {
      await env.GARMIN_INBOX.delete(
        item._r2_key
      );
    }

    await updateDeregistrationWebhookEvent(
      env,
      garminUserId,
      externalId,
      {
        garmin_user_id: null,
        app_user_id: null,
        payload: {
          deregistration_processed: true,
        },
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        processing_error: null,
      }
    );

    await deleteSupabaseRows(
      env,
      "garmin_connections",
      `garmin_user_id=eq.${encodeURIComponent(garminUserId)}`
    );

    console.log(
      `Garmin user deregistered and data removed: ${garminUserId}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      `Garmin deregistration processing failed: ${errorMessage}`
    );

    throw error;
  }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      return Response.json({
        ok: true,
        service: "garmin-webhook-receiver",
      });
    }

    if (request.method !== "POST") {
      return new Response(
        "Method Not Allowed",
        { status: 405 }
      );
    }

    const allowedPaths = new Set([
      "/activities",
      "/dailies",
      "/sleeps",
      "/hrv",
      "/permissions",
      "/deregistrations",
    ]);

    if (!allowedPaths.has(url.pathname)) {
      return new Response(
        "Not Found",
        { status: 404 }
      );
    }

    if (!request.body) {
      return new Response(
        "Missing request body",
        { status: 400 }
      );
    }

    const type =
      url.pathname.slice(1);

    const receivedAt =
      new Date().toISOString();

    const id =
      crypto.randomUUID();

    const key =
      `${type}/${receivedAt.slice(0, 10)}/${receivedAt}-${id}.json`;

    await env.GARMIN_INBOX.put(
      key,
      request.body,
      {
        httpMetadata: {
          contentType:
            request.headers.get(
              "content-type"
            ) ||
            "application/json",
        },
        customMetadata: {
          webhookType: type,
          receivedAt,
        },
      }
    );

    return Response.json(
      {
        ok: true,
        received: true,
      },
      { status: 200 }
    );
  },

  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const notification =
          message.body;

        const key =
          notification?.object?.key;

        const size =
          Number(
            notification?.object?.size ||
            0
          );

        if (!key) {
          console.error(
            "R2 notification missing object key:",
            JSON.stringify(notification)
          );

          message.ack();
          continue;
        }

        const eventType =
          eventTypeFromKey(key);

        if (!eventType) {
          console.log(
            "Ignoring unknown R2 object:",
            key
          );

          message.ack();
          continue;
        }

        const object =
          await env.GARMIN_INBOX.get(key);

        if (!object) {
          throw new Error(
            `R2 object not found: ${key}`
          );
        }

        if (
          size >
          MAX_INLINE_PROCESSING_BYTES
        ) {
          await insertWebhookEvents(
            env,
            [
              {
                event_type: eventType,
                garmin_user_id: null,
                external_id: `r2:${key}`,
                payload: {
                  storage: "r2",
                  r2_key: key,
                  size_bytes: size,
                  processing_mode:
                    "deferred_large_payload",
                  event_time:
                    notification?.eventTime ||
                    null,
                },
                processing_status:
                  "pending",
              },
            ]
          );

          console.log(
            `Large Garmin payload preserved in R2: ${key} (${size} bytes)`
          );

          message.ack();
          continue;
        }

        const payload =
          await object.json();

        let items = [];

        if (eventType === "activity") {
          items =
            Array.isArray(
              payload?.activities
            )
              ? payload.activities
              : [];
        } else if (
          eventType === "daily"
        ) {
          items =
            Array.isArray(
              payload?.dailies
            )
              ? payload.dailies
              : [];
        } else if (
          eventType === "sleep"
        ) {
          items =
            Array.isArray(
              payload?.sleeps
            )
              ? payload.sleeps
              : [];
        } else if (
          eventType === "hrv"
        ) {
          items =
            Array.isArray(
              payload?.hrv
            )
              ? payload.hrv
              : [];
        } else if (
          eventType === "permissions"
        ) {
          items =
            Array.isArray(
              payload?.userPermissionsChange
            )
              ? payload.userPermissionsChange
              : [];
        } else if (
          eventType === "deregistration"
        ) {
          items =
            Array.isArray(
              payload?.deregistrations
            )
              ? payload.deregistrations
              : [];
        }

        if (items.length === 0) {
          await insertWebhookEvents(
            env,
            [
              {
                event_type: eventType,
                garmin_user_id: null,
                external_id: `r2:${key}`,
                payload: {
                  raw: payload,
                  r2_key: key,
                },
                processing_status:
                  "pending",
              },
            ]
          );
        } else {
          const rows =
            items.map(
              (item, index) => {
                const garminUserId =
                  typeof item?.userId ===
                  "string"
                    ? item.userId
                    : null;

                let externalId = null;

                if (
                  item?.activityId != null
                ) {
                  externalId =
                    String(
                      item.activityId
                    );
                } else if (
                  item?.summaryId != null
                ) {
                  externalId =
                    String(
                      item.summaryId
                    );
                } else {
                  externalId =
                    `r2:${key}:${index}`;
                }

                return {
                  event_type:
                    eventType,
                  garmin_user_id:
                    garminUserId,
                  external_id:
                    externalId,
                  payload: {
                    ...item,
                    _r2_key: key,
                  },
                  processing_status:
                    "pending",
                };
              }
            );

          await insertWebhookEvents(
            env,
            rows
          );

          if (
            eventType === "activity" ||
            eventType === "daily" ||
            eventType === "sleep" ||
            eventType === "hrv" ||
            eventType === "deregistration"
          ) {
            for (
              let index = 0;
              index < items.length;
              index += 1
            ) {
              const item =
                items[index];

              const externalId =
                item?.activityId != null
                  ? String(
                      item.activityId
                    )
                  : item?.summaryId != null
                    ? String(
                        item.summaryId
                      )
                    : `r2:${key}:${index}`;

              if (eventType === "activity") {
                await processActivityItem(
                  env,
                  item,
                  externalId
                );
              } else if (eventType === "daily") {
                await processDailyItem(
                  env,
                  item,
                  externalId
                );
              } else if (eventType === "sleep") {
                await processSleepItem(
                  env,
                  item,
                  externalId
                );
              } else if (eventType === "hrv") {
                await processHrvItem(
                  env,
                  item,
                  externalId
                );
              } else {
                await processDeregistrationItem(
                  env,
                  item,
                  externalId
                );
              }
            }
          }
        }

        console.log(
          `Processed Garmin R2 object: ${key}`
        );

        message.ack();
      } catch (error) {
        console.error(
          "Garmin queue processing error:",
          error
        );

        message.retry({
          delaySeconds: 10,
        });
      }
    }
  },
};













