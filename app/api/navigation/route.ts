import { NextResponse } from "next/server";
import { fetchNavigationSummary } from "@/features/navigation/data/navigationRepository";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await fetchNavigationSummary(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Could not load navigation." }, {
      status: 503, headers: { "Cache-Control": "private, no-store" },
    });
  }
}
