import { readWidgetTicket } from "@/lib/session";
import { COOKIES } from "@/lib/cookies";
import { unseal } from "@/lib/crypto";
import { messageForError, type MetricsResult } from "@/lib/data";
import { formatClock, formatMetricValue } from "@/lib/format";
import {
  defaultLocale,
  dirFor,
  isLocale,
  translations,
  type Locale,
} from "@/lib/i18n";
import { isValidTimeZone } from "@/lib/locale";
import { refreshSession } from "@/lib/oura/auth";
import { getTodayMetrics } from "@/lib/oura/client";
import { OuraApiError } from "@/lib/oura/errors";
import { isExpired, needsRefresh, type OuraSession } from "@/lib/session-core";

import type { NextRequest } from "next/server";

export const WIDGET_CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'none'",
  "script-src 'none'",
  "connect-src 'none'",
  "frame-ancestors *",
  "base-uri 'none'",
  "form-action 'self'",
].join("; ");

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function localeFromRequest(request: NextRequest): Locale {
  const cookie = request.cookies.get(COOKIES.locale)?.value;
  if (isLocale(cookie)) {
    return cookie;
  }
  const accept = request.headers.get("accept-language") ?? "";
  if (/(^|,)\s*he\b/i.test(accept)) {
    return "he";
  }
  return defaultLocale;
}

export function timeZoneFromRequest(request: NextRequest): string {
  const value = request.cookies.get(COOKIES.tz)?.value;
  return isValidTimeZone(value) ? value : "UTC";
}

type WidgetModel = {
  locale: Locale;
  timeZone: string;
  result: MetricsResult;
  sessionToWrite?: OuraSession;
};

async function metricsForToken(
  accessToken: string,
  timeZone: string,
  expiredCode: "reconnect" | "widget_expired",
  sessionToWrite?: OuraSession,
): Promise<Pick<WidgetModel, "timeZone" | "result" | "sessionToWrite">> {
  try {
    const metrics = await getTodayMetrics(accessToken, timeZone);
    return {
      timeZone,
      result: { state: "ready", metrics },
      sessionToWrite,
    };
  } catch (error) {
    if (error instanceof OuraApiError) {
      return {
        timeZone,
        result: {
          state: "error",
          code: error.code === "reconnect" ? expiredCode : error.code,
        },
        sessionToWrite,
      };
    }
    return {
      timeZone,
      result: { state: "error", code: "unknown" },
      sessionToWrite,
    };
  }
}

export async function loadWidgetModel(
  request: NextRequest,
  ticket?: string,
): Promise<WidgetModel> {
  const locale = localeFromRequest(request);
  const timeZone = timeZoneFromRequest(request);
  const raw = request.cookies.get(COOKIES.session)?.value;
  if (raw) {
    let session = await unseal<OuraSession>(raw);
    if (session?.accessToken && session.refreshToken) {
      let sessionToWrite: OuraSession | undefined;
      if (needsRefresh(session)) {
        try {
          session = await refreshSession(session);
          sessionToWrite = session;
        } catch {
          if (!isExpired(session) && session) {
            const loaded = await metricsForToken(
              session.accessToken,
              timeZone,
              "reconnect",
            );
            return { locale, ...loaded };
          }
        }
      }

      if (session && !isExpired(session)) {
        const loaded = await metricsForToken(
          session.accessToken,
          timeZone,
          "reconnect",
          sessionToWrite,
        );
        return { locale, ...loaded };
      }
    }
  }

  if (ticket) {
    const payload = await readWidgetTicket(ticket);
    if (!payload) {
      return { locale, timeZone, result: { state: "disconnected" } };
    }
    if (payload.expiresAt <= Date.now()) {
      return {
        locale,
        timeZone,
        result: { state: "error", code: "widget_expired" },
      };
    }
    const loaded = await metricsForToken(
      payload.accessToken,
      timeZone,
      "widget_expired",
    );
    return { locale, ...loaded };
  }

  return { locale, timeZone, result: { state: "disconnected" } };
}

export function widgetHtml(model: WidgetModel): string {
  const { locale, timeZone, result } = model;
  const t = translations[locale];
  const dir = dirFor(locale);
  const body =
    result.state === "ready"
      ? metricsMarkup(locale, timeZone, result.metrics)
      : result.state === "error"
        ? statusMarkup(
            locale,
            messageForError(result.code, t),
            result.code === "widget_expired"
              ? undefined
              : result.code === "reconnect"
                ? { href: "/api/auth/oura?next=/widget", label: t.reconnect }
                : { href: "/widget", label: t.tryAgain },
          )
        : statusMarkup(locale, t.widgetConnectHint, {
            href: "/api/auth/oura?next=/widget",
            label: t.connectOura,
          });

  return `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="only light">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(t.appName)}</title>
<style>
html,body{margin:0;background:#f7f5f0;color:#181818;color-scheme:only light;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
body{padding:8px}
.card{background:#f7f5f0;border:1px solid #e4e0d8;border-radius:18px;padding:14px 12px 12px}
.kicker{color:#77736b;font-size:11px;font-weight:600;letter-spacing:.08em;margin:0 0 12px;text-transform:uppercase}
.grid{display:grid;grid-template-columns:1fr 1fr;column-gap:12px;row-gap:16px}
.wide{grid-column:1/-1;text-align:center}
.value{direction:ltr;unicode-bidi:isolate;font-size:26px;font-weight:700;letter-spacing:-.03em;line-height:1.1;margin:0}
.wide .value{font-size:24px}
.label{color:#77736b;font-size:10px;font-weight:500;letter-spacing:.08em;margin:4px 0 0;text-transform:uppercase}
.updated{color:#77736b;font-size:12px;margin:16px 0 0;text-align:center}
.title{font-size:20px;font-weight:650;letter-spacing:-.02em;margin:0 0 8px}
.hint{color:#77736b;margin:0 0 16px;line-height:1.4}
.btn{display:inline-flex;align-items:center;justify-content:center;background:#b86f52;color:#fff;text-decoration:none;font-weight:600;border-radius:999px;padding:11px 18px}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function metricsMarkup(
  locale: Locale,
  timeZone: string,
  metrics: Extract<MetricsResult, { state: "ready" }>["metrics"],
): string {
  const t = translations[locale];
  const cells = [
    [t.totalBurn, formatMetricValue(metrics.totalCalories, locale, "int"), false],
    [t.activeBurn, formatMetricValue(metrics.activeCalories, locale, "int"), false],
    [t.steps, formatMetricValue(metrics.steps, locale, "int"), false],
    [t.distance, formatMetricValue(metrics.distanceKm, locale, "km"), false],
    [t.heartRate, formatMetricValue(metrics.heartRate, locale, "hr"), true],
  ] as const;

  return `<main class="card" id="content">
<p class="kicker">${escapeHtml(t.today)}</p>
<div class="grid">
${cells
  .map(
    ([label, value, wide]) => `<div class="${wide ? "wide" : ""}">
<p class="value">${escapeHtml(value)}</p>
<p class="label">${escapeHtml(label)}</p>
</div>`,
  )
  .join("\n")}
</div>
<p class="updated">${escapeHtml(t.updated)} ${escapeHtml(formatClock(metrics.lastUpdated, locale, timeZone))}</p>
</main>`;
}

function statusMarkup(
  locale: Locale,
  message: string,
  action?: { href: string; label: string },
): string {
  const t = translations[locale];
  return `<main class="card" id="content">
<h1 class="title">${escapeHtml(t.appName)}</h1>
<p class="hint">${escapeHtml(message)}</p>
${
  action
    ? `<a class="btn" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`
    : ""
}
</main>`;
}
