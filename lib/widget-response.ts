import { NextResponse, type NextRequest } from "next/server";

import { COOKIES, sessionCookieOptions } from "@/lib/cookies";
import { serializeSessionCookie } from "@/lib/session";
import { loadWidgetModel, WIDGET_CSP, widgetHtml } from "@/lib/widget-html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function widgetHeaders(): HeadersInit {
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "private, no-store",
    "Content-Security-Policy": WIDGET_CSP,
  };
}

export async function widgetPageResponse(
  request: NextRequest,
  ticket?: string,
): Promise<NextResponse> {
  const model = await loadWidgetModel(request, ticket);
  const response = new NextResponse(widgetHtml(model), {
    status: 200,
    headers: widgetHeaders(),
  });
  if (model.sessionToWrite) {
    response.cookies.set(
      COOKIES.session,
      await serializeSessionCookie(model.sessionToWrite),
      sessionCookieOptions(),
    );
  }
  return response;
}
