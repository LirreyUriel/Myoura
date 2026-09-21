import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { COOKIES, oauthStateCookieOptions } from "@/lib/cookies";
import { ConfigError, getOuraConfig, OURA_AUTHORIZE_URL, OURA_SCOPES } from "@/lib/oura/config";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { clientId, redirectUri } = getOuraConfig();
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
  } catch (error) {
    const target = new URL(
      error instanceof ConfigError ? "/?error=unavailable" : "/?error=unavailable",
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    );
    return NextResponse.redirect(target);
  }
}
