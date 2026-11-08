// RR-399 A6 · the AI cost ledger: the cost of a call on known token counts, and the free-AI daily budget reads LEDGER units (the
// count × 200 estimate only while the table is not migrated). Pure: fake stores, no DB, no AI, no secrets.
// Run: npx tsx scripts/verify-ai-cost-ledger.ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const DIR = existsSync(join(ROOT, "src/lib/billing/free-ai-budget.ts")) ? "src/lib/billing" : "src/lib";
const imp = (p: string) => import(pathToFileURL(join(ROOT, p)).href);
let failed = 0;
const t = async (name: string, fn: () => unknown) => { try { await fn(); console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}\n       ${(e as Error).message.split("\n")[0]}`); } };

(async () => {
  const cost = await imp("src/lib/ai/cost.ts");
  const models = await imp("src/lib/ai/models.ts");
  const budget = await imp(`${DIR}/free-ai-budget.ts`);
  const now = Date.UTC(2026, 10, 8, 12);
  const free = { id: "f", createdAt: new Date(now - 3_600_000), subscriptionStatus: null, stripeSubscriptionId: null, compProUntil: null };
  const paid = { id: "p", createdAt: new Date(now - 86_400_000 * 30), subscriptionStatus: "active", stripeSubscriptionId: "sub_1", compProUntil: null };
  const store = (ledger: () => Promise<{ userId: string | null; costCents: number }[]>, scored: { userId: string }[] = []) => ({
    aICostLedger: { findMany: ledger },
    koreanAttempt: { findMany: async () => scored },
    user: { findMany: async ({ where }: { where: { id: { in: string[] } } }) => [free, paid].filter((u) => where.id.in.includes(u.id)) },
  });
  const missingTable = () => Promise.reject(Object.assign(new Error('The table "public.AICostLedger" does not exist'), { code: "P2021" }));

  await t("every model the product calls has a price", () => {
    for (const id of Object.values(models.MODELS) as string[]) assert.ok(models.PRICING_USD_PER_MTOK[id], `no price for ${id}`);
  });
  await t("Opus 5 cost on known token counts (1 unit = 1/100 cent)", () => {
    const M = "claude-opus-5";
    assert.equal(cost.computeCostCents(M, { inputTokens: 1_000_000, outputTokens: 0 }), 50_000); //   $5.00
    assert.equal(cost.computeCostCents(M, { inputTokens: 0, outputTokens: 1_000_000 }), 250_000); //  $25.00
    assert.equal(cost.computeCostCents(M, { inputTokens: 2_000, outputTokens: 1_000 }), 350); //      $0.01 + $0.025 = 3.5 cents
    assert.equal(cost.computeCostCents(M, { inputTokens: 0, outputTokens: 0, cacheReadTokens: 1_000_000 }), 5_000); //   $0.50
    assert.equal(cost.computeCostCents(M, { inputTokens: 0, outputTokens: 0, cacheWriteTokens: 1_000_000 }), 62_500); // $6.25
  });
  await t("an unknown model is refused by the cost function (recordCost turns that into a 0-cost row, never a 500)", () => {
    assert.throws(() => cost.computeCostCents("no-such-model", { inputTokens: 1, outputTokens: 1 }), /No pricing/);
    assert.match(readFileSync(join(ROOT, "src/lib/ai/cost.ts"), "utf8"), /pricingError = /);
  });
  await t("the budget reads LEDGER units: today's free accounts' real cost, paid accounts never counted", async () => {
    const spent = await budget.freeAiSpentToday(now, store(async () => [{ userId: "f", costCents: 437 }, { userId: "p", costCents: 900 }, { userId: "f", costCents: 12 }]));
    assert.equal(spent, 449);
    assert.equal(budget.freeAiBudgetLeft(spent), false, "449 ledger units is over the 350-unit day");
  });
  await t("one real Opus scoring is counted at its real cost, not at the old 200-unit guess", async () => {
    const one = cost.computeCostCents("claude-opus-5", { inputTokens: 3_000, outputTokens: 1_200 });
    const spent = await budget.freeAiSpentToday(now, store(async () => [{ userId: "f", costCents: one }], [{ userId: "f" }]));
    assert.equal(spent, one);
    assert.notEqual(spent, budget.FREE_AI_UNITS_PER_SCORING);
  });
  await t("no ledger rows today: 0 spent", async () => {
    assert.equal(await budget.freeAiSpentToday(now, store(async () => [])), 0);
  });
  await t("ONLY while the table is not migrated: today's scored free Writings × 200", async () => {
    assert.equal(await budget.freeAiSpentToday(now, store(missingTable, [{ userId: "f" }, { userId: "p" }])), budget.FREE_AI_UNITS_PER_SCORING);
  });
  await t("any other database fault is NOT hidden behind the estimate", async () => {
    await assert.rejects(budget.freeAiSpentToday(now, store(() => Promise.reject(new Error("connection refused")))), /connection refused/);
  });
  console.log(failed ? `\nAI COST LEDGER TEST FAIL (${failed})` : "\nAI COST LEDGER TEST PASS");
  process.exitCode = failed ? 1 : 0;
})();
