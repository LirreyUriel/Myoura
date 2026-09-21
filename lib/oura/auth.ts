import "server-only";

import {
  getOuraConfig,
  OURA_REVOKE_URL,
  OURA_TOKEN_URL,
} from "@/lib/oura/config";
import { errorFromOuraStatus, OuraApiError } from "@/lib/oura/errors";
import {
  isExpired,
  needsRefresh,
  readSession,
  writeSession,
  type OuraSession,
} from "@/lib/session";

type TokenResponse = {
  token_type?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number | string;
  scope?: string;
};

function sessionFromTokenResponse(
  data: TokenResponse,
  previous?: OuraSession,
): OuraSession {
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token ?? previous?.refreshToken;
  const expiresIn = Number(data.expires_in);

  if (!accessToken || !refreshToken) {
    throw new OuraApiError("unavailable", 500);
  }

  const lifetimeMs =
    Number.isFinite(expiresIn) && expiresIn > 0
      ? expiresIn * 1000
      : 30 * 24 * 60 * 60 * 1000;

  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + lifetimeMs,
    scope: data.scope ?? previous?.scope ?? "",
  };
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  const raw = `${clientId}:${clientSecret}`;
  return `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
}

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const { clientId, clientSecret } = getOuraConfig();
  const response = await fetch(OURA_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: basicAuthHeader(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    let oauthError = "";
    try {
      const payload = (await response.json()) as { error?: string };
      oauthError = payload.error ?? "";
    } catch {
      oauthError = "";
    }
    console.error("oura_token_failed", response.status, oauthError);
    throw errorFromOuraStatus(response.status === 400 ? 401 : response.status);
  }

  return (await response.json()) as TokenResponse;
}

export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
): Promise<OuraSession> {
  const data = await postToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  );
  return sessionFromTokenResponse(data);
}

export async function refreshSession(session: OuraSession): Promise<OuraSession> {
  const data = await postToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    }),
  );
  return sessionFromTokenResponse(data, session);
}

export async function revokeAccess(accessToken: string): Promise<void> {
  const url = new URL(OURA_REVOKE_URL);
  url.searchParams.set("access_token", accessToken);
  try {
    await fetch(url, { cache: "no-store" });
  } catch {
    // Always continue to local session clearing.
  }
}

export async function getFreshSession(): Promise<OuraSession | null> {
  const session = await readSession();
  if (!session) {
    return null;
  }
  if (!needsRefresh(session)) {
    return session;
  }

  try {
    const refreshed = await refreshSession(session);
    await writeSession(refreshed);
    return refreshed;
  } catch {
    if (!isExpired(session)) {
      return session;
    }
    throw new OuraApiError("reconnect", 401);
  }
}
