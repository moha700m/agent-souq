import { NextResponse } from "next/server";
import { getRuntimeMode } from "@/lib/env";

export async function GET() {
  const mode = getRuntimeMode();
  const healthy = mode !== "misconfigured";
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", mode },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
