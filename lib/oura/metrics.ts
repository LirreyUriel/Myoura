import { addDays } from "@/lib/format";

export interface OuraMetrics {
  date: string;
  totalCalories: number | null;
  activeCalories: number | null;
  steps: number | null;
  distanceKm: number | null;
  heartRate: number | null;
  heartRateWeek: (number | null)[];
  lastUpdated: string;
}

export type DailyActivityDocument = {
  day?: string;
  total_calories?: number;
  active_calories?: number;
  steps?: number;
  equivalent_walking_distance?: number;
};

export type HeartRateSample = {
  bpm?: number;
  timestamp?: string;
};

export type SleepHeartRateDocument = {
  day?: string;
  average_heart_rate?: number;
};

export function pickLatestActivity(
  docs: DailyActivityDocument[],
): DailyActivityDocument | null {
  if (docs.length === 0) {
    return null;
  }

  return [...docs].sort((a, b) => (a.day ?? "").localeCompare(b.day ?? "")).at(-1) ??
    null;
}

export function pickLatestHeartRate(
  samples: HeartRateSample[],
): HeartRateSample | null {
  if (samples.length === 0) {
    return null;
  }

  return (
    [...samples].sort((a, b) =>
      (a.timestamp ?? "").localeCompare(b.timestamp ?? ""),
    ).at(-1) ?? null
  );
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function toMetrics(
  activity: DailyActivityDocument | null,
  heartRate: HeartRateSample | null,
): OuraMetrics {
  const meters = activity?.equivalent_walking_distance;

  return {
    date: activity?.day ?? "",
    totalCalories: numberOrNull(activity?.total_calories),
    activeCalories: numberOrNull(activity?.active_calories),
    steps: numberOrNull(activity?.steps),
    distanceKm: meters == null ? null : meters / 1000,
    heartRate: numberOrNull(heartRate?.bpm),
    heartRateWeek: emptyHeartRateWeek(),
    lastUpdated: new Date().toISOString(),
  };
}

export function emptyHeartRateWeek(): (number | null)[] {
  return [null, null, null, null, null, null, null];
}

export function weekDayKeys(todayYmd: string): string[] {
  return [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(todayYmd, offset - 6));
}

export function averagesByDay(
  docs: SleepHeartRateDocument[],
  days: string[],
): (number | null)[] {
  const buckets = new Map<string, number[]>();
  for (const doc of docs) {
    const day = doc.day;
    const bpm = numberOrNull(doc.average_heart_rate);
    if (!day || bpm == null) {
      continue;
    }
    const list = buckets.get(day) ?? [];
    list.push(bpm);
    buckets.set(day, list);
  }

  return days.map((day) => {
    const list = buckets.get(day);
    if (!list?.length) {
      return null;
    }
    return list.reduce((sum, value) => sum + value, 0) / list.length;
  });
}
