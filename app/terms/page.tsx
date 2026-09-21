import type { Metadata } from "next";

import { SiteNav } from "@/components/SiteNav";
import { getLocale } from "@/lib/locale";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Service · ${site.name}`,
  robots: { index: true, follow: true },
};

export default async function TermsPage() {
  const locale = await getLocale();

  return (
    <main id="content" className="prose">
      <h1>Terms of Service</h1>
      <p className="legal-draft-note">
        This is a practical draft for a personal MVP. It requires legal review
        before public or commercial use.
      </p>
      <p className="muted">Last updated: 21 September 2026</p>

      <h2>Service description</h2>
      <p>
        {site.name} is a personal third-party dashboard/widget that retrieves
        selected daily metrics from Oura through the Oura API and displays them
        in a compact web page intended for a phone home-screen website widget. It
        is not a replacement for the Oura app and does not provide a standalone
        fitness or coaching product.
      </p>

      <h2>No medical advice</h2>
      <p>
        This service is for informational and wellness purposes only. It does not
        provide medical advice, diagnosis, treatment, or emergency monitoring.
      </p>

      <h2>Accuracy</h2>
      <p>
        Displayed values come from Oura. Data may be delayed, incomplete,
        unavailable, or changed by Oura. We do not calculate total or active
        calorie burn independently.
      </p>

      <h2>Availability</h2>
      <p>
        The service is provided as-is, with no guarantee of uninterrupted or
        error-free operation. It depends on Oura and on hosting availability.
      </p>

      <h2>Third-party services</h2>
      <p>
        The service depends on Oura and Vercel. Oura is a third-party service.
        This application is not the Oura application, is not affiliated with
        Oura, and does not imply endorsement by Oura.
      </p>

      <h2>Account authorization</h2>
      <p>
        You must authorize access to your Oura account using Oura&apos;s OAuth
        flow. You can disconnect this application at any time and can revoke
        access in your Oura account settings.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You may use this application for your own personal dashboard. You may not
        misuse the Oura API, attempt to access another person&apos;s Oura data, or
        present this widget as the official Oura product.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, the developer is not liable for
        any indirect, incidental, special, consequential, or punitive damages, or
        for any loss of data, health outcomes, or device issues arising from use
        of the service. Oura and Vercel are responsible for their own products
        and services.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
      </p>

      <SiteNav locale={locale} />
    </main>
  );
}
