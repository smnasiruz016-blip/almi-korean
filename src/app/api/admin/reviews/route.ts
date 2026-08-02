// PATCH /api/admin/reviews — founder approves / unapproves a review.
// Admin-gated (canAccessAdmin). Body: { id: string, approved: boolean }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/access";
import { logRefusal } from "@/lib/observability";

export const runtime = "nodejs";

type Body = { id?: unknown; approved?: unknown };

export async function PATCH(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user.email)) {
    logRefusal({ route: "/api/admin/reviews", status: 403, reason: "not-admin", req, userId: user?.id });
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const approved = typeof body.approved === "boolean" ? body.approved : null;
  if (!id || approved === null) {
    return NextResponse.json({ ok: false, error: "id and approved are required" }, { status: 400 });
  }

  try {
    await prisma.review.update({ where: { id }, data: { approved } });
  } catch {
    return NextResponse.json({ ok: false, error: "Review not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, approved });
}
