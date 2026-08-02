// Stub for @/lib/ai/anthropic-client, used ONLY by scripts/writing-grader-proof.mts.
//
// This is the seam, and where it sits is the point: everything BELOW it — the real route, the
// real guard ladder, the real evaluateWriting with its schema parse and its band arithmetic —
// is the code under test. Only the network call itself is replaced. Stubbing one layer higher
// (the grader) would have left the arithmetic untested; one layer lower (fetch) would have
// meant hand-forging Anthropic's wire format to prove nothing extra.
//
// ── WHY THE STATE LIVES ON globalThis ──
// The proof and the route reach this file through the same specifier and the same resolved
// URL, and STILL get two module instances: tsx runs its own loader for .mts alongside the
// registerHooks resolve, and registers the module under its own key. Module-level `let`s
// therefore give the proof a private copy — it sets a knob the route never reads, and every
// "no model call was made" assertion passes by inspecting an array nothing ever wrote to. A
// proof that agrees with itself is worse than no proof, so the mutable state is deliberately
// put somewhere a duplicated module cannot fork.
//
// What this cannot prove: whether the model's JUDGEMENT is any good. That needs a real key and
// a human reading the output. Everything deterministic is proved; that one thing is not.

type Bands = { contentAndTask: string; organization: string | null; languageUse: string };
type State = {
  bands: Bands;
  /** Raw override — used to prove a malformed model reply is REFUSED, not rendered. */
  raw: string | null;
  stopReason: string | null;
  enabled: boolean;
  calls: { system: string; user: string; model: string; maxTokens: number; schema: unknown }[];
};

const KEY = "__almiKoreanAnthropicStub";
const g = globalThis as unknown as Record<string, State | undefined>;

function fresh(): State {
  return {
    bands: { contentAndTask: "strong", organization: "strong", languageUse: "strong" },
    raw: null,
    stopReason: null,
    enabled: true,
    calls: [],
  };
}
function s(): State {
  return (g[KEY] ??= fresh());
}

export const state = s;
export function __setBands(b: Bands): void { const st = s(); st.bands = b; st.raw = null; st.stopReason = null; }
export function __setRaw(text: string): void { s().raw = text; }
export function __setStopReason(r: string): void { s().stopReason = r; }
export function __setEnabled(v: boolean): void { s().enabled = v; }
export function __reset(): void { g[KEY] = fresh(); }
export function __calls(): State["calls"] { return s().calls; }

export const MODELS = { OPUS: "claude-opus-5" } as const;

export function isWritingFeedbackEnabled(): boolean { return s().enabled; }

export function getAnthropicClient() {
  return {
    messages: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: async (params: any) => {
        const st = s();
        st.calls.push({
          system: params.system?.[0]?.text ?? "",
          user: params.messages?.[0]?.content ?? "",
          model: params.model,
          maxTokens: params.max_tokens,
          schema: params.output_config?.format?.schema,
        });
        const text = st.raw ?? JSON.stringify({
          ...st.bands,
          strengths: ["Clear opening sentence."],
          improvements: ["Vary the connectives."],
          overallComment: "A solid attempt for practice.",
        });
        return {
          stop_reason: st.stopReason ?? "end_turn",
          content: [{ type: "text", text }],
          usage: { input_tokens: 100, output_tokens: 50 },
        };
      },
    },
  };
}
