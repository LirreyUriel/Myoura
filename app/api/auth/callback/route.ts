import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIES, oauthStateCookieOptions, sessionCookieOptions } from "@/lib/cookies";
import { unseal } from "@/lib/crypto";
import { exchangeAuthorizationCode } from "@/lib/oura/auth";
import { ConfigError, oauthRedirectUri } from "@/lib/oura/config";
import { serializeSessionCookie } from "@/lib/session";
import { isExpired, type OuraSession } from "@/lib/session-core";

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const params = request.nextUrl.searchParams;
  const error = params.get("error");
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(COOKIES.oauthState)?.value;
  const existingSession = await unseal<OuraSession>(
    request.cookies.get(COOKIES.session)?.value ?? "",
  );

  const finish = (response: NextResponse) => {
    response.cookies.set(COOKIES.oauthState, "", {
      ...oauthStateCookieOptions(),
      maxAge: 0,
    });
    return response;
  };

  if (error) {
    return finish(NextResponse.redirect(new URL("/?error=denied", origin)));
  }

  if (existingSession && !isExpired(existingSession) && !code) {
    return finish(NextResponse.redirect(new URL("/", origin)));
  }

  if (!code || !state || !expectedState || !safeEqual(state, expectedState)) {
    if (existingSession && !isExpired(existingSession)) {
      return finish(NextResponse.redirect(new URL("/", origin)));
    }
    return finish(
      NextResponse.redirect(new URL("/?error=unavailable", origin)),
    );
  }

  try {
    const session = await exchangeAuthorizationCode(
      code,
      oauthRedirectUri(request),
    );
    const response = NextResponse.redirect(new URL("/", origin));
    response.cookies.set(
      COOKIES.session,
      await serializeSessionCookie(session),
      sessionCookieOptions(),
    );
    return finish(response);
  } catch (caught) {
    if (existingSession && !isExpired(existingSession)) {
      return finish(NextResponse.redirect(new URL("/", origin)));
    }
    console.error(
      "oura_callback_failed",
      caught instanceof ConfigError ? "config" : "token",
    );
    const codeParam = caught instanceof ConfigError ? "unavailable" : "reconnect";
    return finish(
      NextResponse.redirect(new URL(`/?error=${codeParam}`, origin)),
    );
  }
}
