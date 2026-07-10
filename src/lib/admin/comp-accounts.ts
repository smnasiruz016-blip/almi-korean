"use server";

// Comp-account admin server actions. Every action independently re-gates on
// ADMIN_EMAILS (isAdmin) — the page guard is defense-in-depth, not the only
// check. Comp = full Pro access without Stripe, with an expiry. Single grant
// per user: revoke nulls compProUntil, extend tops it up.
//
// Ported from AlmiPrep, adapted to the trio schema which tracks comp with the
// single `compProUntil` column (no compGrantedAt/By/Reason). Grant/extend/
// revoke + expiry + days-left work identically; the granted-by/reason audit
// trail is the only thing dropped (would need a 3-column migration to add).

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 365 * 5; // 1825

type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true } & T)
  | { ok: false; error: string };

async function gate(): Promise<
  { ok: true; adminEmail: string } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) return { ok: false, error: "Unauthorized" };
  return { ok: true, adminEmail: user.email };
}

function validDays(n: number): boolean {
  return Number.isFinite(n) && n >= 1 && n <= MAX_DAYS;
}

export async function grantCompPro(input: {
  email: string;
  days?: number;
}): Promise<ActionResult<{ userId: string }>> {
  const g = await gate();
  if (!g.ok) return g;

  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Email is required" };
  const days = Math.floor(input.days ?? 90);
  if (!validDays(days)) return { ok: false, error: `Days must be 1–${MAX_DAYS}` };

  const target = await prisma.user.findUnique({
    where: { email },
    select: { id: true, compProUntil: true },
  });
  if (!target) {
    return { ok: false, error: `No user with email ${email} — they must sign up first.` };
  }
  if (target.compProUntil && target.compProUntil.getTime() > Date.now()) {
    return { ok: false, error: "User already has an active comp — use Extend instead." };
  }

  const now = new Date();
  await prisma.user.update({
    where: { id: target.id },
    data: { compProUntil: new Date(now.getTime() + days * DAY_MS) },
  });

  revalidatePath("/admin/comp-accounts");
  return { ok: true, userId: target.id };
}

export async function revokeCompPro(input: {
  userId: string;
}): Promise<ActionResult> {
  const g = await gate();
  if (!g.ok) return g;
  if (!input.userId) return { ok: false, error: "userId required" };

  await prisma.user.update({
    where: { id: input.userId },
    data: { compProUntil: null },
  });

  revalidatePath("/admin/comp-accounts");
  return { ok: true };
}

export async function extendCompPro(input: {
  userId: string;
  additionalDays: number;
}): Promise<ActionResult> {
  const g = await gate();
  if (!g.ok) return g;
  const days = Math.floor(input.additionalDays);
  if (!validDays(days)) return { ok: false, error: "Invalid number of days" };

  const target = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, compProUntil: true },
  });
  if (!target) return { ok: false, error: "User not found" };

  // Top up from whichever is later: now, or the current (still-active) expiry —
  // so extending an expired comp doesn't credit days in the past.
  const base =
    target.compProUntil && target.compProUntil.getTime() > Date.now()
      ? target.compProUntil.getTime()
      : Date.now();
  await prisma.user.update({
    where: { id: target.id },
    data: { compProUntil: new Date(base + days * DAY_MS) },
  });

  revalidatePath("/admin/comp-accounts");
  return { ok: true };
}

export type CompAccountRow = {
  userId: string;
  email: string;
  name: string | null;
  compProUntil: string;
  isActive: boolean;
  daysRemaining: number | null;
};

export async function listCompAccounts(): Promise<
  ActionResult<{ accounts: CompAccountRow[] }>
> {
  const g = await gate();
  if (!g.ok) return g;

  const rows = await prisma.user.findMany({
    where: { compProUntil: { not: null } },
    select: {
      id: true,
      email: true,
      name: true,
      compProUntil: true,
    },
    orderBy: { compProUntil: "desc" },
  });

  const now = Date.now();
  const accounts: CompAccountRow[] = rows.map((r) => {
    const untilMs = r.compProUntil!.getTime();
    const isActive = untilMs > now;
    return {
      userId: r.id,
      email: r.email,
      name: r.name,
      compProUntil: r.compProUntil!.toISOString(),
      isActive,
      daysRemaining: isActive ? Math.ceil((untilMs - now) / DAY_MS) : null,
    };
  });

  return { ok: true, accounts };
}
