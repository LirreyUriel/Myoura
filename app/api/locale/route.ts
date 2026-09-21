import { NextResponse, type NextRequest } from "next/server";

import { COOKIES, localeCookieOptions } from "@/lib/cookies";
import { isLocale } from "@/lib/i18n";
import { isSafeRelativePath } from "@/lib/oura/errors";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const locale = String(form.get("locale") ?? "");
  const nextRaw = String(form.get("next") ?? "/settings");
  const next = isSafeRelativePath(nextRaw) ? nextRaw : "/settings";

  if (!isLocale(locale)) {
    return NextResponse.redirect(new URL(next, appUrl()), 303);
  }

  const response = NextResponse.redirect(new URL(next, appUrl()), 303);
  response.cookies.set(COOKIES.locale, locale, localeCookieOptions());
  return response;
}
