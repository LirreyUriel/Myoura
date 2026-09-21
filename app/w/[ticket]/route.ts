import { NextResponse, type NextRequest } from "next/server";

import { widgetHeaders, widgetPageResponse } from "@/lib/widget-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ ticket: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { ticket } = await context.params;
  return widgetPageResponse(request, ticket);
}

export function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: widgetHeaders(),
  });
}
