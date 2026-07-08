import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Lightweight session probe for the client-side header (AuthNav). Kept out of
// the server layout on purpose: reading the session cookie in the root layout
// would opt every marketing/SEO page into dynamic rendering. This endpoint is
// dynamic + no-store; the static pages stay static and just fetch it on mount.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    { loggedIn: Boolean(user), email: user?.email ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
