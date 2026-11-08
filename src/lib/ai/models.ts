// RR-399 A6 · the model registry and its pricing, in the same shape as almi-oet's src/lib/ai/models.ts, so the family has one
// pattern for "what did this AI call cost". AlmiKorean calls ONE model: Claude Opus 5 for TOPIK II Writing feedback.

export const MODELS = {
  /** TOPIK II Writing assessment. */
  OPUS: "claude-opus-5",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

// Per-million-token pricing in dollars. Source: Anthropic pricing (claude-opus-5: $5 input / $25 output per MTok).
// Cache read = 10% of input. Cache write 5-min TTL = 1.25x of input (the grader's system prompt carries cache_control).
export const PRICING_USD_PER_MTOK: Record<
  ModelId,
  { input: number; output: number; cacheRead: number; cacheWrite5m: number }
> = {
  "claude-opus-5": {
    input: 5.0,
    output: 25.0,
    cacheRead: 0.5,
    cacheWrite5m: 6.25,
  },
};
