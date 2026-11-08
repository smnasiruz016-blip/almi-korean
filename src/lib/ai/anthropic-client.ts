// The single Anthropic client for AlmiKorean.
//
// One model constant, one client factory. Ported from the family pattern (almi-goethe,
// almi-cv-v2) but pinned to the CURRENT model rather than the one those repos were written
// against — the sibling repos pin claude-sonnet-4-6, which was current when they shipped.

import Anthropic from "@anthropic-ai/sdk";

// RR-399 A6: the model names and their prices live in ./models.ts (as almi-oet); every call's cost is written to AICostLedger by
// recordCost() in ./cost.ts, called by the caller so it can attach the userId and a feature label.
export { MODELS } from "./models";

let client: Anthropic | null = null;

/** Throws if the key is absent — the caller turns that into an honest 503, never a fake score. */
export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function isWritingFeedbackEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
