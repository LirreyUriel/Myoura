import { NextResponse, type NextRequest } from "next/server";

import { COOKIES } from "@/lib/cookies";
import { unseal } from "@/lib/crypto";
import { needsRefresh, type OuraSession } from "@/lib/session-core";

export async function proxy(request: NextRequest) {
  if (!process.env.SESSION_SECRET) {
    return NextResponse.next();
  }

  const raw = request.cookies.get(COOKIES.session)?.value;
  if (!raw) {
    return NextResponse.next();
  }

  const session = await unseal<OuraSession>(raw);
  if (!session || !needsRefresh(session)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/api/auth/refresh";
  url.search = "";
  url.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/settings"],
};
