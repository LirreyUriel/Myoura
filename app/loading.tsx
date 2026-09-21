import { MetricsGrid } from "@/components/MetricsGrid";

import { translations } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function HomeLoading() {
  const locale = await getLocale();
  const t = translations[locale];

  return (
    <main id="content" className="app-shell">
      <h1 className="page-title">{t.appName}</h1>
      <MetricsGrid locale={locale} loading />
    </main>
  );
}
