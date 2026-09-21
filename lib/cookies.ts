export const COOKIES = {
  session: "oura_session",
  oauthState: "oura_oauth_state",
  oauthPkce: "oura_oauth_pkce",
  locale: "oura_locale",
  tz: "oura_tz",
} as const;

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;
export const LOCALE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const TZ_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function oauthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  };
}

export function localeCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: LOCALE_MAX_AGE_SECONDS,
  };
}

export function tzCookieOptions() {
  return {
    httpOnly: false,
    secure: isSecureCookie(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: TZ_MAX_AGE_SECONDS,
  };
}
