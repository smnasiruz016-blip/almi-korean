/**
 * RR-397 · THE FREE-AI BUDGET: the owner allows at most $1 a day of AI for free (no-card) accounts across ALL AlmiWorld products.
 *
 * There is no store shared by the products (each has its own database), so the $1 is split equally between the 19 products that give
 * free AI (18 + AlmiOET): $1 / 19 = $0.0526 each. This product starts a free AI scoring only while what free accounts spent TODAY (UTC)
 * is under FREE_AI_DAILY_BUDGET_UNITS = $0.035. The last call may run past it by ONE call, so a product's worst day is one call over.
 *
 * RR-399 A6 · spend is read from this product's own AICostLedger (costCents is in 1/100 of a cent), like the other products: rows
 * written today for accounts that never subscribed (the free-48-hours accounts). Every AI call writes a row with its REAL cost
 * (src/lib/ai/cost.ts recordCost; Korean's TOPIK II Writing feedback runs on Claude Opus 5, so a real scoring can cost more than the
 * old 2-cent guess). ONLY while the AICostLedger table is not there yet (the owner has not run the migration), the old estimate
 * stands: today's SCORED Writing attempts by free accounts × FREE_AI_UNITS_PER_SCORING. Paying subscribers and running card trials
 * are never counted and never limited here.
 */
import { prisma } from "@/lib/prisma";
import { tasteEndsAt } from "./taste";

/** the estimate per AI scoring, in ledger units (1/100 cent), used ONLY while the AICostLedger table is not migrated yet */
export const FREE_AI_UNITS_PER_SCORING = 200;

/** in AICostLedger units (1/100 cent): 350 = $0.035 per UTC day for this product */
export const FREE_AI_DAILY_BUDGET_UNITS = 350;
export const FREE_AI_BUSY_MESSAGE = "Free AI scoring is busy today. Try again tomorrow, or unlock everything now for $12/month.";

export function startOfUtcDay(now: number = Date.now()): Date {
  const d = new Date(now);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Pure: is there budget left, given today's free spend? */
export function freeAiBudgetLeft(spentUnitsToday: number): boolean {
  return spentUnitsToday < FREE_AI_DAILY_BUDGET_UNITS;
}

/** Pure: sum today's ledger rows that belong to free (never-subscribed) accounts. */
export function sumFreeSpend(
  rows: { userId: string | null; costCents: number }[],
  users: { id: string; createdAt?: Date | null; subscriptionStatus?: string | null; stripeSubscriptionId?: string | null; compProUntil?: Date | null }[],
): number {
  const free = new Set(users.filter((u) => tasteEndsAt(u) !== null).map((u) => u.id));
  return rows.reduce((s, r) => s + (r.userId && free.has(r.userId) ? r.costCents : 0), 0);
}

/** Pure: is this the database saying "that table does not exist" (Prisma P2021), i.e. the migration has not been run yet? */
export function isMissingTable(e: unknown): boolean {
  return (e as { code?: string } | null)?.code === "P2021";
}

type BudgetUser = { id: string; createdAt: Date | null; subscriptionStatus: string | null; stripeSubscriptionId: string | null; compProUntil: Date | null };
/** the smallest store this needs (the real one is prisma; the offline test passes a fake) */
export type BudgetStore = {
  aICostLedger: { findMany(args: { where: { timestamp: { gte: Date }; userId: { not: null } }; select: { userId: true; costCents: true } }): Promise<{ userId: string | null; costCents: number }[]> };
  koreanAttempt: { findMany(args: { where: { section: "WRITING"; status: "SCORED"; createdAt: { gte: Date } }; select: { userId: true } }): Promise<{ userId: string }[]> };
  user: { findMany(args: { where: { id: { in: string[] } }; select: { id: true; createdAt: true; subscriptionStatus: true; stripeSubscriptionId: true; compProUntil: true } }): Promise<BudgetUser[]> };
};

/** What free accounts spent on AI today (UTC), in ledger units. Read-only. */
export async function freeAiSpentToday(now: number = Date.now(), db: BudgetStore = prisma as unknown as BudgetStore): Promise<number> {
  const since = startOfUtcDay(now);
  let rows: { userId: string | null; costCents: number }[];
  try {
    rows = await db.aICostLedger.findMany({ where: { timestamp: { gte: since }, userId: { not: null } }, select: { userId: true, costCents: true } });
  } catch (e) {
    if (!isMissingTable(e)) throw e;
    // the AICostLedger table is not migrated yet: the old estimate (count × FREE_AI_UNITS_PER_SCORING) until it is
    const scored = await db.koreanAttempt.findMany({ where: { section: "WRITING", status: "SCORED", createdAt: { gte: since } }, select: { userId: true } });
    rows = scored.map((a) => ({ userId: a.userId, costCents: FREE_AI_UNITS_PER_SCORING }));
  }
  if (rows.length === 0) return 0;
  const ids = [...new Set(rows.map((r) => r.userId as string))];
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, createdAt: true, subscriptionStatus: true, stripeSubscriptionId: true, compProUntil: true } });
  return sumFreeSpend(rows, users);
}

export async function freeAiAllowedToday(now: number = Date.now()): Promise<boolean> {
  return freeAiBudgetLeft(await freeAiSpentToday(now));
}
