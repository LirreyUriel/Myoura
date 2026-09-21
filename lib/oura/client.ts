import "server-only";

import { OURA_API_BASE } from "@/lib/oura/config";
import { errorFromOuraStatus } from "@/lib/oura/errors";
import {
  pickLatestActivity,
  pickLatestHeartRate,
  toMetrics,
  type DailyActivityDocument,
  type HeartRateSample,
  type OuraMetrics,
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
  const latest = await ouraGet<CollectionResponse<HeartRateSample>>(
    "/v2/usercollection/heartrate",
    accessToken,
    { latest: "true" },
  );

  const fromLatest = pickLatestHeartRate(latest.data ?? []);
  if (fromLatest) {
    return fromLatest;
  }

  const end = new Date();
  const start = new Date(end.getTime() - 12 * 60 * 60 * 1000);
  const windowed = await ouraGet<CollectionResponse<HeartRateSample>>(
    "/v2/usercollection/heartrate",
    accessToken,
    {
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
    },
  );

  return pickLatestHeartRate(windowed.data ?? []);
}

export async function getTodayMetrics(
  accessToken: string,
  timeZone = "UTC",
): Promise<OuraMetrics> {
  const [activity, heartRate] = await Promise.all([
    getTodayActivity(accessToken, timeZone),
    getLatestHeartRate(accessToken),
  ]);

  return toMetrics(activity, heartRate);
}
