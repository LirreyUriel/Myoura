import "server-only";

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
  const clientId = process.env.OURA_CLIENT_ID;
  const clientSecret = process.env.OURA_CLIENT_SECRET;
  const redirectUri = process.env.OURA_REDIRECT_URI;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !redirectUri || !appUrl) {
    throw new ConfigError();
  }

  return { clientId, clientSecret, redirectUri, appUrl };
}

export class ConfigError extends Error {
  constructor() {
    super("Server is missing required configuration");
    this.name = "ConfigError";
  }
}
