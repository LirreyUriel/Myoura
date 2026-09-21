import { translations, type Locale } from "@/lib/i18n";

type ConnectPanelProps = {
  locale: Locale;
  compact?: boolean;
  hint?: boolean;
  error?: string;
  detail?: string;
};

export function ConnectPanel({
  locale,
  compact,
  hint,
  error,
  detail,
}: ConnectPanelProps) {
  const t = translations[locale];

  return (
    <section className={compact ? "connect-panel compact" : "connect-panel"}>
      <h1 className="page-title">{t.appName}</h1>
      {!compact ? <p className="page-tagline">{t.tagline}</p> : null}
      {error ? (
        <p className="status-message" role="alert">
          {error}
        </p>
      ) : null}
      {detail ? <p className="page-tagline">{detail}</p> : null}
      {hint ? <p className="page-tagline">{t.widgetConnectHint}</p> : null}
      <a className="btn-primary" href="/api/auth/oura">
        {t.connectOura}
      </a>
    </section>
  );
}
