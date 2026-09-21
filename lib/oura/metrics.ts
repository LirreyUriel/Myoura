export interface OuraMetrics {
  date: string;
  totalCalories: number | null;
  activeCalories: number | null;
  steps: number | null;
  distanceKm: number | null;
  heartRate: number | null;
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
    lastUpdated: new Date().toISOString(),
  };
}
