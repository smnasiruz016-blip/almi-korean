// RR-399 A6 · the cost of an AI call, and the row it writes to AICostLedger. Same arithmetic and same failure rules as almi-oet's
// src/lib/ai/cost.ts + recordCost() in its anthropic-client.ts. Kept in its own file (not in anthropic-client.ts) so the offline
// writing-grader proof, which replaces anthropic-client at resolve, still runs the REAL cost code.
import { prisma } from "@/lib/prisma";
import { PRICING_USD_PER_MTOK, type ModelId } from "@/lib/ai/models";

export type Usage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
};

/**
 * Compute the dollar cost of an Anthropic call. Result is in 1/100 cents
 * (i.e. an integer where 1 = $0.0001) so tiny costs are stored exactly as ints.
 * Cache-write tokens are billed at the 5-minute-TTL rate (1.25x input).
 */
export function computeCostCents(model: ModelId, usage: Usage): number {
  const rates = PRICING_USD_PER_MTOK[model];
  if (!rates) {
    throw new Error(`No pricing for model ${model}`);
  }
  const dollars =
    (usage.inputTokens / 1_000_000) * rates.input +
    (usage.outputTokens / 1_000_000) * rates.output +
    ((usage.cacheReadTokens ?? 0) / 1_000_000) * rates.cacheRead +
    ((usage.cacheWriteTokens ?? 0) / 1_000_000) * rates.cacheWrite5m;
  // 1 hundredth-of-a-cent = $0.0001 = dollars * 10_000
  return Math.round(dollars * 10_000);
}

/** Append one AI call to AICostLedger. Never throws: an accounting fault must not cost the learner a result they already got. */
export async function recordCost(input: {
  userId: string | null;
  feature: string;
  model: ModelId;
  usage: Usage;
  success: boolean;
  errorMessage?: string;
}): Promise<number> {
  // A pricing gap is an accounting problem, not a reason to fail a user (almi-oet learned this the hard way): price it at 0, say so
  // loudly in the log AND in the row, and let the result through.
  let costCents = 0;
  let pricingError: string | null = null;
  if (input.success) {
    try {
      costCents = computeCostCents(input.model, input.usage);
    } catch (e) {
      pricingError = e instanceof Error ? e.message : String(e);
      console.error(
        `[ai-cost-ledger] NO PRICING for model "${input.model}" (feature ${input.feature}) — recording costCents=0. ` +
          `This call WAS billed by the provider but is NOT costed here. Add it to PRICING_USD_PER_MTOK in lib/ai/models.ts.`,
      );
    }
  }
  const errorMessage = pricingError
    ? [input.errorMessage, `unpriced model: ${pricingError}`].filter(Boolean).join(" | ")
    : input.errorMessage;

  try {
    await prisma.aICostLedger.create({
      data: {
        userId: input.userId,
        feature: input.feature,
        model: input.model,
        inputTokens: input.usage.inputTokens,
        outputTokens: input.usage.outputTokens,
        cacheReadTokens: input.usage.cacheReadTokens ?? 0,
        cacheWriteTokens: input.usage.cacheWriteTokens ?? 0,
        costCents,
        success: input.success,
        errorMessage,
      },
    });
  } catch (e) {
    // Before the owner runs the migration the table is not there: log and move on (the budget falls back to its count estimate).
    console.error("[ai-cost-ledger] insert failed:", e instanceof Error ? e.message : String(e));
  }
  return costCents;
}
