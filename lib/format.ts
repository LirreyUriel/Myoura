import { translations, type Locale } from "@/lib/i18n";

export function ymdInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(ymd: string, amount: number): string {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function formatInteger(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDistanceKm(value: number, locale: Locale): string {
  const number = new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-US", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
  return `${number} ${translations[locale].km}`;
}

export function formatMetricValue(
  value: number | null,
  locale: Locale,
  kind: "int" | "km" | "hr",
): string {
  if (value === null) {
    return "—";
  }
  if (kind === "km") {
    return formatDistanceKm(value, locale);
  }
  if (kind === "hr") {
    return `${formatInteger(value, locale)} ${translations[locale].bpm}`;
  }
  return formatInteger(value, locale);
}

export function formatClock(
  iso: string,
  locale: Locale,
  timeZone?: string,
): string {
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timeZone || undefined,
  }).format(new Date(iso));
}
