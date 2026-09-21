import "server-only";

import { cookies } from "next/headers";

import { COOKIES, sessionCookieOptions } from "@/lib/cookies";
import { seal, unseal } from "@/lib/crypto";
import type { OuraSession } from "@/lib/session-core";
import { appOrigin } from "@/lib/site";

export type { OuraSession } from "@/lib/session-core";
export { isExpired, needsRefresh } from "@/lib/session-core";

export async function readSession(): Promise<OuraSession | null> {
  const jar = await cookies();
  const value = jar.get(COOKIES.session)?.value;
  if (!value) {
    return null;
  }
  const session = await unseal<OuraSession>(value);
  if (
    !session?.accessToken ||
    !session.refreshToken ||
    typeof session.expiresAt !== "number"
  ) {
    return null;
  }
  return session;
}

export async function writeSession(session: OuraSession): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIES.session, await seal(session), sessionCookieOptions());
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIES.session);
}

export async function serializeSessionCookie(
  session: OuraSession,
): Promise<string> {
  return seal(session);
}

export type WidgetTicket = {
  accessToken: string;
  expiresAt: number;
};

export async function serializeWidgetTicket(
  session: OuraSession,
): Promise<string> {
  const ticket: WidgetTicket = {
    accessToken: session.accessToken,
    expiresAt: session.expiresAt,
  };
  return seal(ticket);
}

export async function readWidgetTicket(
  ticket: string,
): Promise<WidgetTicket | null> {
  const payload = await unseal<WidgetTicket>(ticket);
  if (!payload?.accessToken || typeof payload.expiresAt !== "number") {
    return null;
  }
  return payload;
}

export async function widgetShareUrl(
  session: OuraSession,
): Promise<string | null> {
  const origin = appOrigin();
  if (!origin) {
    return null;
  }
  return `${origin}/w/${await serializeWidgetTicket(session)}`;
}
