"use client";

export default function WidgetError({ reset }: { reset: () => void }) {
  return (
    <main id="content" className="app-shell-widget">
      <section className="widget-card widget-card-compact" role="alert">
        <p className="status-message">We couldn&apos;t update your Oura data.</p>
        <button className="btn-primary" type="button" onClick={() => reset()}>
          Try again
        </button>
      </section>
    </main>
  );
}
