import Link from "next/link";

import { refreshMetrics } from "@/app/actions";
import { translations, type Locale } from "@/lib/i18n";
import { formatClock } from "@/lib/format";
import { site } from "@/lib/site";

type DashboardFooterProps = {
  locale: Locale;
  lastUpdated?: string;
  timeZone?: string;
};

export function DashboardFooter({
  locale,
  lastUpdated,
  timeZone,
}: DashboardFooterProps) {
  const t = translations[locale];

  return (
    <footer className="dashboard-footer">
      <p>{t.connectedToOura}</p>
      {lastUpdated ? (
        <p>
          {t.lastUpdated}:{" "}
          <span className="metric-value-inline">
            {formatClock(lastUpdated, locale, timeZone)}
          </span>
        </p>
      ) : null}
      <div className="footer-actions">
        <form action={refreshMetrics}>
          <button className="btn-quiet" type="submit">
            {t.refresh}
          </button>
        </form>
        <form action="/api/auth/logout" method="post">
          <button className="btn-quiet" type="submit">
            {t.disconnectOura}
          </button>
        </form>
      </div>
      <nav className="legal-nav" aria-label="Site">
        <Link href="/settings">{t.settings}</Link>
        <Link href="/privacy">{t.privacy}</Link>
        <Link href="/terms">{t.terms}</Link>
      </nav>
      <p className="attribution">{site.attribution}</p>
    </footer>
  );
}
