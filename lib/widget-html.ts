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
import { getWidgetMetrics } from "@/lib/oura/client";
import { OuraApiError } from "@/lib/oura/errors";
import { emptyHeartRateWeek } from "@/lib/oura/metrics";
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
    const metrics = await getWidgetMetrics(accessToken, timeZone);
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
.grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1.2fr;gap:10px}
.tile{display:flex;flex-direction:column;justify-content:center;border-radius:18px;padding:12px;min-height:0;border:1px solid rgba(190,255,240,.35)}
.tile-burn{background:rgba(0,220,180,.2)}
.tile-distance{background:rgba(40,210,160,.2)}
.tile-heart{grid-column:1/-1;background:rgba(0,170,210,.2)}
.tile-burn .value{font-size:clamp(1.15rem,5.4vw,1.7rem)}
.row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.icon{font-size:1.7rem;line-height:1;margin:0;flex:0 0 auto}
.value{direction:ltr;unicode-bidi:isolate;font-size:clamp(1.35rem,6.5vw,2rem);font-weight:600;letter-spacing:-.04em;line-height:1;margin:0;color:#111}
.label{margin:4px 0 0;font-size:.78rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#111}
.meter{margin-top:8px;height:8px;border-radius:999px;background:rgba(8,40,48,.14);overflow:hidden}
.meter-fill{display:block;height:100%;border-radius:999px;background:rgba(0,150,130,.75)}
.chart{display:block;width:100%;height:52px;margin:8px 0 0}
.status{display:flex;flex-direction:column;justify-content:center;height:100%;border-radius:18px;padding:18px;background:rgba(16,186,180,.2);border:1px solid rgba(190,255,240,.35)}
.title{font-size:1.25rem;font-weight:600;margin:0 0 8px}
.hint{color:#111;margin:0 0 16px;line-height:1.4}
.btn{display:inline-flex;align-items:center;justify-content:center;background:rgba(16,210,168,.55);color:#111;text-decoration:none;font-weight:600;border-radius:999px;padding:11px 18px}
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
  const active = formatMetricValue(metrics.activeCalories, "en", "int");
  const total = formatMetricValue(metrics.totalCalories, "en", "int");
  const fill =
    metrics.activeCalories != null &&
    metrics.totalCalories != null &&
    metrics.totalCalories > 0
      ? Math.min(100, Math.max(0, (metrics.activeCalories / metrics.totalCalories) * 100))
      : 0;

  return `<main class="grid" id="content" aria-label="${escapeHtml(t.appName)}">
<section class="tile tile-burn">
<div class="row">
<p class="value">${escapeHtml(`${active} / ${total}`)}</p>
<p class="icon" aria-hidden="true">🔥</p>
</div>
<div class="meter" role="img" aria-label="${escapeHtml(`${active} / ${total}`)}"><span class="meter-fill" style="width:${fill.toFixed(1)}%"></span></div>
<p class="label">${escapeHtml(t.activeOfTotal)}</p>
</section>
<section class="tile tile-distance">
<div class="row">
<p class="value">${escapeHtml(formatMetricValue(metrics.distanceKm, "en", "km"))}</p>
<p class="icon" aria-hidden="true">🚲</p>
</div>
<p class="label">${escapeHtml(t.distance)}</p>
</section>
<section class="tile tile-heart">
<div class="row">
<p class="value">${escapeHtml(formatMetricValue(metrics.heartRate, "en", "hr"))}</p>
<p class="icon" aria-hidden="true">❤️</p>
</div>
${heartRateChart(metrics.heartRateWeek)}
<p class="label">${escapeHtml(t.heartRate)}</p>
</section>
</main>`;
}

function heartRateChart(week: (number | null)[] | undefined): string {
  const values = week?.length === 7 ? week : emptyHeartRateWeek();
  const known = values.filter((value): value is number => value != null);
  if (known.length === 0) {
    return `<svg class="chart" viewBox="0 0 140 52" preserveAspectRatio="none" aria-hidden="true"></svg>`;
  }

  const min = Math.min(...known);
  const max = Math.max(...known);
  const span = max - min || 1;
  const width = 140;
  const height = 52;
  const padX = 6;
  const padY = 8;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = values.length > 1 ? innerW / (values.length - 1) : 0;

  const points = values.map((value, index) => {
    const x = padX + index * step;
    const y =
      value == null
        ? null
        : padY + innerH - ((value - min) / span) * innerH;
    return { x, y };
  });

  const polyline = points
    .filter((point): point is { x: number; y: number } => point.y != null)
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

  const dots = points
    .filter((point): point is { x: number; y: number } => point.y != null)
    .map(
      (point) =>
        `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2.4" fill="#111"/>`,
    )
    .join("");

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Weekly heart rate">
<polyline fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${polyline}"/>
${dots}
</svg>`;
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
