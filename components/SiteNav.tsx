import Link from "next/link";

import { translations, type Locale } from "@/lib/i18n";

export function SiteNav({ locale, current }: { locale: Locale; current?: string }) {
  const t = translations[locale];

  return (
    <nav className="legal-nav" aria-label="Site">
      {current !== "home" ? <Link href="/">{t.appName}</Link> : null}
      {current !== "settings" ? <Link href="/settings">{t.settings}</Link> : null}
      <Link href="/privacy">{t.privacy}</Link>
      <Link href="/terms">{t.terms}</Link>
    </nav>
  );
}
