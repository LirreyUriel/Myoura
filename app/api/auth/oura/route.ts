import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIES, oauthStateCookieOptions } from "@/lib/cookies";
import {
  callbackUrlFromRequest,
  ConfigError,
  getOuraConfig,
  OURA_AUTHORIZE_URL,
  OURA_SCOPES,
} from "@/lib/oura/config";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { clientId } = getOuraConfig();
    const redirectUri = callbackUrlFromRequest(request.nextUrl.origin);
    if (!redirectUri) {
      throw new ConfigError();
    }

    const state = randomBytes(32).toString("base64url");
    const authorize = new URL(OURA_AUTHORIZE_URL);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("scope", OURA_SCOPES);
    authorize.searchParams.set("state", state);

    const response = NextResponse.redirect(authorize);
    response.cookies.set(COOKIES.oauthState, state, oauthStateCookieOptions());
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/?error=unavailable", request.nextUrl.origin),
    );
  }
}
