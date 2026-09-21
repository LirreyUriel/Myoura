import { NextResponse, type NextRequest } from "next/server";

import { COOKIES, sessionCookieOptions } from "@/lib/cookies";
import { readSession } from "@/lib/session";
import { revokeAccess } from "@/lib/oura/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (session) {
    await revokeAccess(session.accessToken);
  }

  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin), 303);
  response.cookies.set(COOKIES.session, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
