import type { Metadata } from "next";

import { SiteNav } from "@/components/SiteNav";
import { getLocale } from "@/lib/locale";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy · ${site.name}`,
  robots: { index: true, follow: true },
};

export default async function PrivacyPage() {
  const locale = await getLocale();

  return (
    <main id="content" className="prose">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: 21 September 2026</p>
      <p>
        {site.name} is a personal dashboard/widget that displays selected daily
        metrics from your Oura account. It is not the Oura app.
      </p>

      <h2>Data we collect</h2>
      <p>We process only what is required to show the widget:</p>
      <ul>
        <li>Oura daily activity values (calories, steps, and distance)</li>
        <li>The latest available Oura heart-rate sample</li>
        <li>
          OAuth tokens and related authorization data needed to keep your Oura
          connection
        </li>
        <li>
          A language preference and device timezone, stored as cookies so the
          widget can render in the correct locale and Oura day
        </li>
      </ul>
      <p>
        We do not request the email scope. This app only retrieves daily
        activity and heart rate. Other Oura API scopes may appear on the
        consent screen so they match the permissions enabled for this
        application; we do not fetch email, name, or personal-profile records.
      </p>

      <h2>Purpose</h2>
      <p>
        Data is processed solely to display your Oura health metrics through this
        personal dashboard/widget.
      </p>

      <h2>Storage and retention</h2>
      <p>
        Oura health data is not permanently stored as an application database.
        Metrics are retrieved from Oura when you load or refresh the dashboard or
        widget, used to render the page, and are not kept as historical records.
      </p>
      <p>
        Authorization tokens are stored in an encrypted, HttpOnly session cookie
        on your device so the widget can stay signed in. We do not use this data
        for analytics, advertising, profiling, or model training.
      </p>
      <p>
        Tokens are kept only while your connection is active, and for no longer
        than the session cookie lifetime (up to 180 days, refreshed while you
        continue to use the app). Disconnecting deletes the local session cookie
        and requests revocation at Oura.
      </p>

      <h2>Third parties</h2>
      <p>This service depends on:</p>
      <ul>
        <li>Oura, which provides your health metrics through the Oura API</li>
        <li>Vercel, which hosts the application</li>
      </ul>
      <p>We do not send your Oura data to advertising, analytics, or AI providers.</p>

      <h2>Your rights</h2>
      <ul>
        <li>
          Disconnect this application at any time using Disconnect Oura, which
          clears the local session and asks Oura to revoke access
        </li>
        <li>
          Revoke access from your Oura account settings at{" "}
          {site.ouraRevokeUrl}
        </li>
        <li>
          Request deletion by disconnecting, which removes the authorization
          data this app stores. Health metrics are not kept in an app database
        </li>
        <li>
          Contact the developer at{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        Oura API calls run on the server. The Oura client secret and tokens are
        never exposed to browser JavaScript, URLs, or unauthenticated endpoints.
      </p>

      <SiteNav locale={locale} />
    </main>
  );
}
