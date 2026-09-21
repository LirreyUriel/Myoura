import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIES, oauthStateCookieOptions, sessionCookieOptions } from "@/lib/cookies";
import { callbackUrlFromRequest, ConfigError } from "@/lib/oura/config";
import { exchangeAuthorizationCode } from "@/lib/oura/auth";
import { serializeSessionCookie } from "@/lib/session";

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

  const jar = await cookies();
  const expectedState = jar.get(COOKIES.oauthState)?.value;

  const clearState = (response: NextResponse) => {
    response.cookies.set(COOKIES.oauthState, "", {
      ...oauthStateCookieOptions(),
      maxAge: 0,
    });
    return response;
  };

  if (error) {
    return clearState(NextResponse.redirect(new URL("/?error=denied", origin)));
  }

  if (!code || !state || !expectedState || !safeEqual(state, expectedState)) {
    return clearState(
      NextResponse.redirect(new URL("/?error=unavailable", origin)),
    );
  }

  try {
    const session = await exchangeAuthorizationCode(
      code,
      callbackUrlFromRequest(origin),
    );
    const response = NextResponse.redirect(new URL("/", origin));
    response.cookies.set(
      COOKIES.session,
      await serializeSessionCookie(session),
      sessionCookieOptions(),
    );
    return clearState(response);
  } catch (caught) {
    console.error(
      "oura_callback_failed",
      caught instanceof ConfigError ? "config" : "token",
    );
    const codeParam = caught instanceof ConfigError ? "unavailable" : "reconnect";
    return clearState(
      NextResponse.redirect(new URL(`/?error=${codeParam}`, origin)),
    );
  }
}
