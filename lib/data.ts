import "server-only";

import { getTodayMetrics } from "@/lib/oura/client";
import { OuraApiError, type UserErrorCode } from "@/lib/oura/errors";
import type { OuraMetrics } from "@/lib/oura/metrics";
import { getTimeZone } from "@/lib/locale";
import { isExpired, readSession } from "@/lib/session";

export type MetricsResult =
  | { state: "disconnected" }
  | { state: "ready"; metrics: OuraMetrics }
  | { state: "error"; code: UserErrorCode };

export async function loadMetrics(): Promise<MetricsResult> {
  const session = await readSession();
  if (!session) {
    return { state: "disconnected" };
  }
  if (isExpired(session)) {
    return { state: "error", code: "reconnect" };
  }

  try {
    const timeZone = await getTimeZone();
    const metrics = await getTodayMetrics(session.accessToken, timeZone);
    return { state: "ready", metrics };
  } catch (error) {
    if (error instanceof OuraApiError) {
      return { state: "error", code: error.code };
    }
    return { state: "error", code: "unknown" };
  }
}

export function messageForError(
  code: UserErrorCode | string | undefined,
  t: {
    reconnectNeeded: string;
    loginFailed: string;
    rateLimited: string;
    forbidden: string;
    unavailable: string;
    denied: string;
    errorUpdate: string;
  },
): string {
  switch (code) {
    case "reconnect":
      return t.reconnectNeeded;
    case "login":
      return t.loginFailed;
    case "rate_limited":
      return t.rateLimited;
    case "forbidden":
      return t.forbidden;
    case "denied":
      return t.denied;
    case "unavailable":
      return t.unavailable;
    default:
      return t.errorUpdate;
  }
}
