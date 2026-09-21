export type UserErrorCode =
  | "reconnect"
  | "rate_limited"
  | "forbidden"
  | "unavailable"
  | "denied"
  | "unknown";

export class OuraApiError extends Error {
  constructor(
    public readonly code: Exclude<UserErrorCode, "denied" | "unknown">,
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
