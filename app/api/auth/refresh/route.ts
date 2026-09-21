import { NextResponse, type NextRequest } from "next/server";

import { COOKIES, sessionCookieOptions } from "@/lib/cookies";
import { unseal } from "@/lib/crypto";
import { refreshSession } from "@/lib/oura/auth";
import { isSafeRelativePath } from "@/lib/oura/errors";
import { serializeSessionCookie } from "@/lib/session";
import { isExpired, needsRefresh, type OuraSession } from "@/lib/session-core";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const nextParam = request.nextUrl.searchParams.get("next") ?? "/";
  const next = isSafeRelativePath(nextParam) ? nextParam : "/";

  const raw = request.cookies.get(COOKIES.session)?.value;
  if (!raw) {
    return NextResponse.redirect(new URL("/?error=reconnect", origin));
  }

  const session = await unseal<OuraSession>(raw);
  if (!session) {
    const response = NextResponse.redirect(new URL("/?error=reconnect", origin));
    response.cookies.set(COOKIES.session, "", { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  }

  if (!needsRefresh(session)) {
    return NextResponse.redirect(new URL(next, origin));
  }

  try {
    const refreshed = await refreshSession(session);
    const response = NextResponse.redirect(new URL(next, origin));
    response.cookies.set(
      COOKIES.session,
      await serializeSessionCookie(refreshed),
      sessionCookieOptions(),
    );
    return response;
  } catch {
    if (!isExpired(session)) {
      return NextResponse.redirect(new URL(next, origin));
    }
    const response = NextResponse.redirect(new URL("/?error=reconnect", origin));
    response.cookies.set(COOKIES.session, "", { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  }
}
