import { translations, type Locale } from "@/lib/i18n";
import type { UserErrorCode } from "@/lib/oura/errors";
import { messageForError } from "@/lib/data";

type ErrorPanelProps = {
  locale: Locale;
  code?: UserErrorCode | string;
  compact?: boolean;
};

export function ErrorPanel({ locale, code, compact }: ErrorPanelProps) {
  const t = translations[locale];
  const reconnect = code === "reconnect";

  return (
    <section className={compact ? "connect-panel compact" : "connect-panel"} role="alert">
      <p className="status-message">{messageForError(code, t)}</p>
      {reconnect ? (
        <a
          className="btn-primary"
          href={compact ? "/api/auth/oura?next=/widget" : "/api/auth/oura"}
        >
          {t.reconnect}
        </a>
      ) : (
        <form action={compact ? "/widget" : "/"} method="get">
          <button className="btn-primary" type="submit">
            {t.tryAgain}
          </button>
        </form>
      )}
    </section>
  );
}
