import { NextResponse } from "next/server";

import { getFreshSession } from "@/lib/oura/auth";
import { getLatestHeartRate } from "@/lib/oura/client";
import { OuraApiError } from "@/lib/oura/errors";
import { toMetrics } from "@/lib/oura/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getFreshSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const sample = await getLatestHeartRate(session.accessToken);

    return NextResponse.json(
      { heartRate: toMetrics(null, sample).heartRate },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof OuraApiError) {
      const status =
        error.code === "reconnect"
          ? 401
          : error.code === "forbidden"
            ? 403
            : error.code === "rate_limited"
              ? 429
              : 502;
      return NextResponse.json({ error: error.code }, { status });
    }
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
