export type UserErrorCode =
  | "reconnect"
  | "login"
  | "rate_limited"
  | "forbidden"
  | "unavailable"
  | "denied"
  | "unknown";

export const SAFE_OAUTH_ERRORS = [
  "invalid_request",
  "invalid_client",
  "invalid_grant",
  "unauthorized_client",
  "unsupported_grant_type",
  "invalid_scope",
  "server_error",
  "temporarily_unavailable",
] as const;

export type SafeOAuthError = (typeof SAFE_OAUTH_ERRORS)[number];

export function asSafeOAuthError(value: string | undefined): SafeOAuthError | undefined {
  return SAFE_OAUTH_ERRORS.find((item) => item === value);
}

export class OAuthTokenError extends Error {
  constructor(
    public readonly oauthError: string,
    public readonly status: number,
  ) {
    super(oauthError);
    this.name = "OAuthTokenError";
  }
}

export class OuraApiError extends Error {
  constructor(
    public readonly code: Exclude<UserErrorCode, "denied" | "unknown" | "login">,
    public readonly status: number,
  ) {
    super(code);
    this.name = "OuraApiError";
  }
}

export function errorFromOuraStatus(status: number): OuraApiError {
  if (status === 401) {
    return new OuraApiError("reconnect", status);
  }
  if (status === 403) {
    return new OuraApiError("forbidden", status);
  }
  if (status === 429) {
    return new OuraApiError("rate_limited", status);
  }
  return new OuraApiError("unavailable", status);
}

export function isSafeRelativePath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}
