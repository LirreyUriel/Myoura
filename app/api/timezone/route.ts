import { NextResponse, type NextRequest } from "next/server";

import { COOKIES, tzCookieOptions } from "@/lib/cookies";
import { isValidTimeZone } from "@/lib/locale";

export async function POST(request: NextRequest) {
  let timeZone = "";
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { timeZone?: string };
    timeZone = body.timeZone ?? "";
  } else {
    const form = await request.formData();
    timeZone = String(form.get("timeZone") ?? "");
  }

  if (!isValidTimeZone(timeZone)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIES.tz, timeZone, tzCookieOptions());
  return response;
}
