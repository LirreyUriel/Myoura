# Oura Home Widget

Personal Next.js dashboard that reads selected daily metrics from the official Oura API and renders a compact `/widget` page for an Android home-screen website widget.

This is a personal dashboard, not a replacement for the Oura app.

## What it shows

Values come from Oura, not Health Connect, and are not recalculated locally:

- **Total Burn** — `total_calories`
- **Active Burn** — `active_calories`
- **Steps** — `steps`
- **Distance** — `equivalent_walking_distance` (meters from Oura, shown in km)
- **Heart Rate** — latest `bpm`

## Setup

1. Create an Oura application at [cloud.ouraring.com/oauth/applications](https://cloud.ouraring.com/oauth/applications).
2. Set the Redirect URI to exactly `https://YOUR_DOMAIN/api/auth/callback`. For local development you may also register `http://localhost:3000/api/auth/callback` if Oura allows it.
3. Request only the `daily` and `heartrate` scopes.
4. Copy `.env.example` to `.env.local` and fill in:

```text
OURA_CLIENT_ID=
OURA_CLIENT_SECRET=
OURA_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=
CONTACT_EMAIL=
```

Generate `SESSION_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Install and run:

```bash
npm install
npm run dev
```

6. On Vercel, set the same environment variables. `OURA_REDIRECT_URI` and `NEXT_PUBLIC_APP_URL` must use your HTTPS production origin. `OURA_CLIENT_SECRET` and `SESSION_SECRET` must remain server-only.

## Privacy and security

- Oura tokens live in an encrypted HttpOnly cookie. There is no user database and no health-data history store.
- The browser never calls `api.ouraring.com`.
- `/privacy` and `/terms` are public. The terms page is a draft and needs legal review before public or commercial use.
- There is no analytics, advertising, or AI processing of Oura data.

## Android website widget (session check)

The widget URL is `/widget`. It requires the same authenticated cookie as the rest of the app. If a website-widget WebView cannot keep that cookie, **stop** — do not put tokens or health data in a URL.

Verify before relying on the home-screen widget:

1. Open `/widget` inside the website-widget WebView (not only in Chrome).
2. Tap **Connect Oura** in that same WebView and complete OAuth.
3. Confirm today's metrics render.
4. Close the widget/WebView and open it again.
5. If metrics still appear, the session cookie persists and the architecture is valid.
6. If you are asked to connect again, that WebView cannot preserve the session. Treat this as an architecture blocker. Do not add a secret widget URL.

Chrome login does **not** count unless the widget WebView shares those cookies.

## Routes

- `/` dashboard
- `/widget` chrome-less widget
- `/connect` starts OAuth
- `/settings` language and disconnect
- `/privacy` `/terms`
- `/api/auth/oura` `/api/auth/callback` `/api/auth/logout`
- `/api/oura/activity` `/api/oura/heartrate` (session cookie required)
