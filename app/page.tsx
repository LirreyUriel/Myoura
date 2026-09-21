import { ConnectPanel } from "@/components/ConnectPanel";
import { DashboardFooter } from "@/components/DashboardFooter";
import { ErrorPanel } from "@/components/ErrorPanel";
import { MetricsGrid } from "@/components/MetricsGrid";
import { loadMetrics, messageForError } from "@/lib/data";
import { translations } from "@/lib/i18n";
import { getLocale, getTimeZone } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const [{ error, detail }, locale, timeZone, result] = await Promise.all([
    searchParams,
    getLocale(),
    getTimeZone(),
    loadMetrics(),
  ]);
  const t = translations[locale];
  const queryError = error ? messageForError(error, t) : undefined;

  return (
    <main id="content" className="app-shell">
      {result.state === "disconnected" ? (
        <ConnectPanel locale={locale} error={queryError} detail={detail} />
      ) : null}

      {result.state === "error" ? (
        <ErrorPanel locale={locale} code={result.code} />
      ) : null}

      {result.state === "ready" ? (
        <>
          <h1 className="page-title">{t.appName}</h1>
          <p className="page-tagline">{t.notTheOuraApp}</p>
          <MetricsGrid
            locale={locale}
            metrics={result.metrics}
            timeZone={timeZone}
          />
          <DashboardFooter
            locale={locale}
            lastUpdated={result.metrics.lastUpdated}
            timeZone={timeZone}
          />
        </>
      ) : null}
    </main>
  );
}
