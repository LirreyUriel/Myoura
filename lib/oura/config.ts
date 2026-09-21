function readEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export const OURA_AUTHORIZE_URL = "https://cloud.ouraring.com/oauth/authorize";
export const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
export const OURA_REVOKE_URL = "https://api.ouraring.com/oauth/revoke";
export const OURA_API_BASE = "https://api.ouraring.com";
export const OURA_SCOPES = "daily heartrate";

export type OuraConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  appUrl: string;
};

export function getOuraConfig(): OuraConfig {
  const clientId = readEnv("OURA_CLIENT_ID");
  const clientSecret = readEnv("OURA_CLIENT_SECRET");
  const redirectUri = readEnv("OURA_REDIRECT_URI");
  const appUrl = readEnv("NEXT_PUBLIC_APP_URL") || readEnv("APP_URL");

  if (!clientId || !clientSecret) {
    throw new ConfigError();
  }

  return { clientId, clientSecret, redirectUri, appUrl };
}

export function callbackUrlFromRequest(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/auth/callback`;
}

export class ConfigError extends Error {
  constructor() {
    super("Server is missing required configuration");
    this.name = "ConfigError";
  }
}
