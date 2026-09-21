import "server-only";

import { cookies } from "next/headers";

import { COOKIES, sessionCookieOptions } from "@/lib/cookies";
import { seal, unseal } from "@/lib/crypto";
import type { OuraSession } from "@/lib/session-core";

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
