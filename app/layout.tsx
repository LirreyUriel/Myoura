import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Heebo, Inter } from "next/font/google";

import { TimezoneSync } from "@/components/TimezoneSync";
import { COOKIES } from "@/lib/cookies";
import {
  defaultLocale,
  dirFor,
  isLocale,
  translations,
  type Locale,
} from "@/lib/i18n";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: site.name,
  description: translations.en.tagline,
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const raw = jar.get(COOKIES.locale)?.value;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = translations[locale];

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${inter.variable} ${heebo.variable} h-full antialiased ${locale === "he" ? "is-he" : "is-en"}`}
    >
      <body className="app-body min-h-full">
        <a className="skip-link" href="#content">
          {t.skipToContent}
        </a>
        <TimezoneSync />
        {children}
      </body>
    </html>
  );
}
