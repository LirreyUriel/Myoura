import "server-only";

import {
  getOuraConfig,
  OURA_REVOKE_URL,
  OURA_TOKEN_URL,
  OURA_TOKEN_URL_LEGACY,
} from "@/lib/oura/config";
import { errorFromOuraStatus, OAuthTokenError, OuraApiError } from "@/lib/oura/errors";
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
    console.error(
      "oura_token_shape",
      Boolean(accessToken),
      Boolean(refreshToken),
      data.expires_in ?? "missing",
    );
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

type TokenFailure = {
  ok: false;
  status: number;
  oauthError: string;
};

type TokenSuccess = {
  ok: true;
  data: TokenResponse;
};

async function postTokenTo(
  url: string,
  body: URLSearchParams,
): Promise<TokenSuccess | TokenFailure> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (response.ok) {
    return { ok: true, data: (await response.json()) as TokenResponse };
  }

  let oauthError = "";
  try {
    const payload = (await response.json()) as { error?: string };
    oauthError = payload.error ?? "";
  } catch {
    oauthError = "";
  }

  console.error("oura_token_failed", new URL(url).host, response.status, oauthError);
  return { ok: false, status: response.status, oauthError };
}

function throwTokenFailure(result: TokenFailure): never {
  if (result.oauthError) {
    throw new OAuthTokenError(result.oauthError, result.status);
  }
  throw errorFromOuraStatus(result.status === 400 ? 401 : result.status);
}

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const { clientId, clientSecret } = getOuraConfig();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);

  // authorization_code is single-use. Try moi first so a 401 from the
  // legacy endpoint cannot burn the code before the live endpoint sees it.
  const primary = await postTokenTo(OURA_TOKEN_URL, body);
  if (primary.ok) {
    return primary.data;
  }

  if (primary.status === 400 || primary.status === 401) {
    const fallback = await postTokenTo(OURA_TOKEN_URL_LEGACY, body);
    if (fallback.ok) {
      return fallback.data;
    }
    throwTokenFailure(fallback);
  }

  throwTokenFailure(primary);
}

export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<OuraSession> {
  const params: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  };
  if (codeVerifier) {
    params.code_verifier = codeVerifier;
  }
  const data = await postToken(new URLSearchParams(params));
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
