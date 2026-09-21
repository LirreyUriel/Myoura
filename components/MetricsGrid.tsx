import { translations, type Locale } from "@/lib/i18n";
import { formatClock, formatMetricValue } from "@/lib/format";
import type { OuraMetrics } from "@/lib/oura/metrics";
import { MetricCell } from "@/components/MetricCell";

type MetricsGridProps = {
  locale: Locale;
  metrics?: OuraMetrics | null;
  loading?: boolean;
  timeZone?: string;
  compact?: boolean;
};

export function MetricsGrid({
  locale,
  metrics,
  loading,
  timeZone,
  compact,
}: MetricsGridProps) {
  const t = translations[locale];

  return (
    <section
      aria-label={t.appName}
      aria-busy={loading}
      aria-live="polite"
      className={`widget-card ${compact ? "widget-card-compact" : ""}`}
    >
      <p className="widget-kicker">{t.today}</p>
      <div className="metrics-grid">
        <MetricCell
          label={t.totalBurn}
          value={formatMetricValue(metrics?.totalCalories ?? null, locale, "int")}
          loading={loading}
        />
        <MetricCell
          label={t.activeBurn}
          value={formatMetricValue(metrics?.activeCalories ?? null, locale, "int")}
          loading={loading}
        />
        <MetricCell
          label={t.steps}
          value={formatMetricValue(metrics?.steps ?? null, locale, "int")}
          loading={loading}
        />
        <MetricCell
          label={t.distance}
          value={formatMetricValue(metrics?.distanceKm ?? null, locale, "km")}
          loading={loading}
        />
        <MetricCell
          label={t.heartRate}
          value={formatMetricValue(metrics?.heartRate ?? null, locale, "hr")}
          loading={loading}
          wide
        />
      </div>
      <p className="widget-updated">
        {t.updated}{" "}
        <span className="metric-value-inline">
          {metrics
            ? formatClock(metrics.lastUpdated, locale, timeZone)
            : loading
              ? "——"
              : "—"}
        </span>
      </p>
    </section>
  );
}
