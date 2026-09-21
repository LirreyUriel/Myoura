import { readWidgetTicket } from "@/lib/session";
import { COOKIES } from "@/lib/cookies";
import { unseal } from "@/lib/crypto";
import { messageForError, type MetricsResult } from "@/lib/data";
import { formatMetricValue } from "@/lib/format";
import {
  defaultLocale,
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

const WIDGET_COPY = translations.en;

export function widgetHtml(model: WidgetModel): string {
  const { result } = model;
  const t = WIDGET_COPY;
  const body =
    result.state === "ready"
      ? metricsMarkup(result.metrics)
      : result.state === "error"
        ? statusMarkup(
            messageForError(result.code, t),
            result.code === "widget_expired"
              ? undefined
              : result.code === "reconnect"
                ? { href: "/api/auth/oura?next=/widget", label: t.reconnect }
                : { href: "/widget", label: t.tryAgain },
          )
        : statusMarkup(t.widgetConnectHint, {
            href: "/api/auth/oura?next=/widget",
            label: t.connectOura,
          });

  return `<!DOCTYPE html>
<html lang="en" dir="ltr" style="background:transparent;background-color:transparent">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(t.appName)}</title>
<style>
html,body,#content,.grid{margin:0;height:100%;background:transparent!important;background-color:rgba(0,0,0,0)!important;background-image:none!important}
html,body{color:#111;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
body{box-sizing:border-box;padding:8px}
.grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px}
.tile{display:flex;flex-direction:column;justify-content:space-between;border-radius:18px;padding:12px;min-height:0;border:1px solid rgba(190,255,240,.35)}
.tile-burn{background:rgba(0,220,180,.2)}
.tile-active{background:rgba(0,200,210,.2)}
.tile-distance{background:rgba(40,210,160,.2)}
.tile-heart{background:rgba(0,170,210,.2)}
.icon{font-size:1.7rem;line-height:1;margin:0}
.value{direction:ltr;unicode-bidi:isolate;font-size:clamp(1.35rem,6.5vw,2rem);font-weight:800;letter-spacing:-.04em;line-height:1;margin:8px 0 auto;color:#111}
.label{margin:8px 0 0;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#111}
.status{display:flex;flex-direction:column;justify-content:center;height:100%;border-radius:18px;padding:18px;background:rgba(16,186,180,.2);border:1px solid rgba(190,255,240,.35)}
.title{font-size:1.25rem;font-weight:800;margin:0 0 8px}
.hint{color:#111;margin:0 0 16px;line-height:1.4}
.btn{display:inline-flex;align-items:center;justify-content:center;background:rgba(16,210,168,.55);color:#111;text-decoration:none;font-weight:800;border-radius:999px;padding:11px 18px}
</style>
</head>
<body style="background:transparent;background-color:transparent">
${body}
</body>
</html>`;
}

function metricsMarkup(
  metrics: Extract<MetricsResult, { state: "ready" }>["metrics"],
): string {
  const t = WIDGET_COPY;
  const tiles = [
    ["tile-burn", "🔥", t.totalBurn, formatMetricValue(metrics.totalCalories, "en", "int")],
    ["tile-active", "🏃", t.activeBurn, formatMetricValue(metrics.activeCalories, "en", "int")],
    ["tile-distance", "🚲", t.distance, formatMetricValue(metrics.distanceKm, "en", "km")],
    ["tile-heart", "❤️", t.heartRate, formatMetricValue(metrics.heartRate, "en", "hr")],
  ] as const;

  return `<main class="grid" id="content" aria-label="${escapeHtml(t.appName)}">
${tiles
  .map(
    ([tone, icon, label, value]) => `<section class="tile ${tone}">
<p class="icon" aria-hidden="true">${icon}</p>
<p class="value">${escapeHtml(value)}</p>
<p class="label">${escapeHtml(label)}</p>
</section>`,
  )
  .join("\n")}
</main>`;
}

function statusMarkup(
  message: string,
  action?: { href: string; label: string },
): string {
  const t = WIDGET_COPY;
  return `<main class="status" id="content">
<h1 class="title">${escapeHtml(t.appName)}</h1>
<p class="hint">${escapeHtml(message)}</p>
${
  action
    ? `<a class="btn" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`
    : ""
}
</main>`;
}
