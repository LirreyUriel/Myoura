import "server-only";

import { OURA_API_BASE } from "@/lib/oura/config";
import { errorFromOuraStatus, OuraApiError } from "@/lib/oura/errors";
import {
  averagesByDay,
  emptyHeartRateWeek,
  pickLatestActivity,
  pickLatestHeartRate,
  toMetrics,
  weekDayKeys,
  type DailyActivityDocument,
  type HeartRateSample,
  type OuraMetrics,
  type SleepHeartRateDocument,
} from "@/lib/oura/metrics";
import { addDays, ymdInZone } from "@/lib/format";

async function ouraGet<T>(
  path: string,
  accessToken: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(path, OURA_API_BASE);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("oura_api_failed", path, response.status);
    throw errorFromOuraStatus(response.status);
  }

  return (await response.json()) as T;
}

type CollectionResponse<T> = {
  data?: T[];
};

export async function getTodayActivity(
  accessToken: string,
  timeZone = "UTC",
): Promise<DailyActivityDocument | null> {
  const today = ymdInZone(new Date(), timeZone);
  const start = addDays(today, -1);
  const end = addDays(today, 1);

  const payload = await ouraGet<CollectionResponse<DailyActivityDocument>>(
    "/v2/usercollection/daily_activity",
    accessToken,
    { start_date: start, end_date: end },
  );

  return pickLatestActivity(payload.data ?? []);
}

export async function getLatestHeartRate(
  accessToken: string,
): Promise<HeartRateSample | null> {
  try {
    const latest = await ouraGet<CollectionResponse<HeartRateSample>>(
      "/v2/usercollection/heartrate",
      accessToken,
      { latest: "true" },
    );
    const fromLatest = pickLatestHeartRate(latest.data ?? []);
    if (fromLatest) {
      return fromLatest;
    }
  } catch (error) {
    if (error instanceof OuraApiError && error.code === "reconnect") {
      throw error;
    }
  }

  const end = new Date();
  const start = new Date(end.getTime() - 12 * 60 * 60 * 1000);

  try {
    const windowed = await ouraGet<CollectionResponse<HeartRateSample>>(
      "/v2/usercollection/heartrate",
      accessToken,
      {
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
      },
    );
    return pickLatestHeartRate(windowed.data ?? []);
  } catch (error) {
    if (error instanceof OuraApiError && error.code === "reconnect") {
      throw error;
    }
    return null;
  }
}

export async function getTodayMetrics(
  accessToken: string,
  timeZone = "UTC",
): Promise<OuraMetrics> {
  let activity: DailyActivityDocument | null = null;
  try {
    activity = await getTodayActivity(accessToken, timeZone);
  } catch (error) {
    if (error instanceof OuraApiError && error.code === "reconnect") {
      throw error;
    }
    console.error(
      "oura_activity_failed",
      error instanceof OuraApiError ? error.status : 0,
    );
  }

  let heartRate: HeartRateSample | null = null;
  try {
    heartRate = await getLatestHeartRate(accessToken);
  } catch (error) {
    if (
      error instanceof OuraApiError &&
      error.code === "reconnect" &&
      !activity
    ) {
      throw error;
    }
    console.error(
      "oura_heartrate_failed",
      error instanceof OuraApiError ? error.status : 0,
    );
  }

  return toMetrics(activity, heartRate);
}

export async function getWeeklyHeartRate(
  accessToken: string,
  timeZone = "UTC",
): Promise<(number | null)[]> {
  const today = ymdInZone(new Date(), timeZone);
  const days = weekDayKeys(today);

  try {
    const payload = await ouraGet<CollectionResponse<SleepHeartRateDocument>>(
      "/v2/usercollection/sleep",
      accessToken,
      { start_date: addDays(today, -6), end_date: addDays(today, 1) },
    );
    return averagesByDay(payload.data ?? [], days);
  } catch (error) {
    console.error(
      "oura_weekly_heartrate_failed",
      error instanceof OuraApiError ? error.status : 0,
    );
    return emptyHeartRateWeek();
  }
}

export async function getWidgetMetrics(
  accessToken: string,
  timeZone = "UTC",
): Promise<OuraMetrics> {
  const [metrics, heartRateWeek] = await Promise.all([
    getTodayMetrics(accessToken, timeZone),
    getWeeklyHeartRate(accessToken, timeZone),
  ]);
  return { ...metrics, heartRateWeek };
}
