import { SiteNav } from "@/components/SiteNav";
import { translations } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { readSession } from "@/lib/session";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [locale, session] = await Promise.all([getLocale(), readSession()]);
  const t = translations[locale];
  const connected = Boolean(session);

  return (
    <main id="content" className="app-shell">
      <h1 className="page-title">{t.settings}</h1>
      <p className="page-tagline">{t.notTheOuraApp}</p>

      <section className="settings-card">
        <h2 className="metric-label">{t.language}</h2>
        <div className="lang-row">
          <form action="/api/locale" method="post">
            <input type="hidden" name="locale" value="en" />
            <input type="hidden" name="next" value="/settings" />
            <button className={locale === "en" ? "btn-primary" : "btn-quiet"} type="submit">
              {t.english}
            </button>
          </form>
          <form action="/api/locale" method="post">
            <input type="hidden" name="locale" value="he" />
            <input type="hidden" name="next" value="/settings" />
            <button className={locale === "he" ? "btn-primary" : "btn-quiet"} type="submit">
              {t.hebrew}
            </button>
          </form>
        </div>
      </section>

      <section className="settings-card">
        <p>{connected ? t.connectedToOura : t.tagline}</p>
        {connected ? (
          <form action="/api/auth/logout" method="post">
            <button className="btn-quiet" type="submit">
              {t.disconnectOura}
            </button>
          </form>
        ) : (
          <a className="btn-primary" href="/api/auth/oura">
            {t.connectOura}
          </a>
        )}
      </section>

      <p className="attribution">{site.attribution}</p>
      <SiteNav locale={locale} current="settings" />
    </main>
  );
}
