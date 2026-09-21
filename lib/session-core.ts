export type OuraSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
};

const REFRESH_SKEW_MS = 5 * 60 * 1000;

export function needsRefresh(session: OuraSession): boolean {
  return session.expiresAt - Date.now() < REFRESH_SKEW_MS;
}

export function isExpired(session: OuraSession): boolean {
  return session.expiresAt <= Date.now();
}
