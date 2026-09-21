import { ConnectPanel } from "@/components/ConnectPanel";
import { ErrorPanel } from "@/components/ErrorPanel";
import { MetricsGrid } from "@/components/MetricsGrid";
import { loadMetrics } from "@/lib/data";
import { getLocale, getTimeZone } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function WidgetPage() {
  const [locale, timeZone, result] = await Promise.all([
    getLocale(),
    getTimeZone(),
    loadMetrics(),
  ]);

  return (
    <main id="content" className="app-shell-widget">
      {result.state === "disconnected" ? (
        <ConnectPanel locale={locale} compact hint />
      ) : null}
      {result.state === "error" ? (
        <ErrorPanel locale={locale} code={result.code} compact />
      ) : null}
      {result.state === "ready" ? (
        <MetricsGrid
          locale={locale}
          metrics={result.metrics}
          timeZone={timeZone}
          compact
        />
      ) : null}
    </main>
  );
}
