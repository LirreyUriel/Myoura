import "server-only";

import { cookies } from "next/headers";

import { COOKIES } from "@/lib/cookies";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

const IANA_TIME_ZONE = /^[A-Za-z0-9_+\-/]+$/;

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(COOKIES.locale)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export function isValidTimeZone(value: string | undefined | null): value is string {
  if (!value || !IANA_TIME_ZONE.test(value) || value.length > 64) {
    return false;
  }
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export async function getTimeZone(): Promise<string> {
  const jar = await cookies();
  const value = jar.get(COOKIES.tz)?.value;
  return isValidTimeZone(value) ? value : "UTC";
}
