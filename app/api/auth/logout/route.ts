import { NextResponse } from "next/server";

import { COOKIES, sessionCookieOptions } from "@/lib/cookies";
import { readSession } from "@/lib/session";
import { revokeAccess } from "@/lib/oura/auth";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export const runtime = "nodejs";

export async function POST() {
  const session = await readSession();
  if (session) {
    await revokeAccess(session.accessToken);
  }

  const response = NextResponse.redirect(new URL("/", appUrl()), 303);
  response.cookies.set(COOKIES.session, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
