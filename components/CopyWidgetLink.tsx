"use client";

import { useState } from "react";

import { translations, type Locale } from "@/lib/i18n";

type CopyWidgetLinkProps = {
  locale: Locale;
  url: string;
};

export function CopyWidgetLink({ locale, url }: CopyWidgetLinkProps) {
  const t = translations[locale];
  const [copied, setCopied] = useState(false);

  return (
    <section className="settings-card">
      <h2 className="metric-label">{t.widgetLink}</h2>
      <p className="page-tagline">{t.widgetLinkHint}</p>
      <input
        className="widget-link-input"
        readOnly
        value={url}
        aria-label={t.widgetLink}
      />
      <button
        className="btn-primary"
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
          });
        }}
      >
        {copied ? t.copied : t.copyWidgetLink}
      </button>
    </section>
  );
}
