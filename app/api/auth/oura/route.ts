import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIES, oauthStateCookieOptions } from "@/lib/cookies";
import {
  getOuraConfig,
  oauthRedirectUri,
  OURA_AUTHORIZE_URL,
  OURA_SCOPES,
} from "@/lib/oura/config";
import { isSafeAppReturnPath } from "@/lib/oura/errors";
import { createPkce } from "@/lib/oura/pkce";

export const runtime = "nodejs";

function oauthReturnPath(request: NextRequest): "/" | "/widget" {
  const next = request.nextUrl.searchParams.get("next") ?? "";
  if (isSafeAppReturnPath(next)) {
    return next;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      if (
        url.origin === request.nextUrl.origin &&
        isSafeAppReturnPath(url.pathname)
      ) {
        return url.pathname;
      }
    } catch {
      // Ignore malformed Referer.
    }
  }

  return "/";
}

export async function GET(request: NextRequest) {
  try {
    const { clientId } = getOuraConfig();
    const redirectUri = oauthRedirectUri(request);
    const state = randomBytes(32).toString("base64url");
    const pkce = createPkce();
    const authorize = new URL(OURA_AUTHORIZE_URL);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("scope", OURA_SCOPES);
    authorize.searchParams.set("state", state);
    authorize.searchParams.set("code_challenge", pkce.challenge);
    authorize.searchParams.set("code_challenge_method", "S256");

    const response = NextResponse.redirect(authorize);
    response.cookies.set(COOKIES.oauthState, state, oauthStateCookieOptions());
    response.cookies.set(COOKIES.oauthPkce, pkce.verifier, oauthStateCookieOptions());
    response.cookies.set(
      COOKIES.oauthNext,
      oauthReturnPath(request),
      oauthStateCookieOptions(),
    );
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/?error=unavailable", request.nextUrl.origin),
    );
  }
}
