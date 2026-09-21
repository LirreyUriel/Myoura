import { MetricsGrid } from "@/components/MetricsGrid";
import { getLocale } from "@/lib/locale";

export default async function WidgetLoading() {
  const locale = await getLocale();

  return (
    <main id="content" className="app-shell-widget">
      <MetricsGrid locale={locale} loading compact />
    </main>
  );
}
