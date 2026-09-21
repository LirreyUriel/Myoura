"use client";

import { useEffect } from "react";

export function TimezoneSync() {
  useEffect(() => {
    try {
      if (window.location.pathname.startsWith("/widget")) {
        return;
      }

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timeZone) {
        return;
      }

      const encoded = document.cookie
        .split("; ")
        .find((row) => row.startsWith("oura_tz="))
        ?.slice("oura_tz=".length);
      const current = encoded ? decodeURIComponent(encoded) : "";
      if (current === timeZone) {
        return;
      }

      void fetch("/api/timezone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeZone }),
      });
    } catch {
      // Limited WebViews may lack Intl or cookies; never blank the page.
    }
  }, []);

  return null;
}
