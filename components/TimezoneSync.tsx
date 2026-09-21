"use client";

import { useEffect } from "react";

export function TimezoneSync() {
  useEffect(() => {
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
  }, []);

  return null;
}
