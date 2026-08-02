// The single Anthropic client for AlmiKorean.
//
// One model constant, one client factory. Ported from the family pattern (almi-goethe,
// almi-cv-v2) but pinned to the CURRENT model rather than the one those repos were written
// against — the sibling repos pin claude-sonnet-4-6, which was current when they shipped.

import Anthropic from "@anthropic-ai/sdk";

export const MODELS = {
  /** TOPIK II Writing assessment. */
  OPUS: "claude-opus-5",
} as const;

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
