// AI criteria-based feedback for TOPIK II Writing (Tasks 51–54).
//
// ── WHAT THIS CLOSES ──
// The landing page has sold "AI criteria feedback on all TOPIK II Writing tasks (51–54),
// always labelled an estimate" since launch, and Writing is the paid-gated section — but
// WritingComposer was a character counter and nothing else. This is the grader that claim
// requires.
//
// ── THE CRITERIA ARE TOPIK'S OWN, NOT A SIBLING'S ──
// AlmiGoethe's productive grader uses four axes (communication / coherence / range /
// accuracy). Those are the Goethe/telc axes. TOPIK 쓰기 is assessed on its own three:
//
//   내용 및 과제 수행   content and task fulfilment
//   글의 전개 구조      organisation and development   ← Tasks 53/54 only
//   언어사용            language use (grammar, vocabulary, register)
//
// Tasks 51 and 52 are two-blank sentence completions and are NOT assessed on organisation —
// there is no discourse to organise. Asking for an organisation band on a one-sentence answer
// would produce a number with nothing behind it, so the schema omits it for 51/52 and the
// prompt says why.
//
// ── WHAT IS DELIBERATELY NOT CLAIMED ──
// The real exam weights these criteria into 100 points across the four tasks. Published
// sub-weights disagree with each other, and inventing a split would dress a guess as an
// official mark. So this returns a BAND per criterion plus one overall 0–100 estimate derived
// from those bands by a formula stated in this file — never presented as the official
// weighting, and labelled an estimate at every readout.
//
// ── THE CHARACTER BAND IS CHECKED IN CODE, NOT BY THE MODEL ──
// Tasks 53 (200–300자) and 54 (600–700자) carry a hard band. That is arithmetic, and a
// language model is the wrong instrument for it — it would be asked to count characters and
// would sometimes be wrong. It is measured here and applied as a deterministic penalty, and
// the model is TOLD the count so its language-use judgement accounts for length without
// having to derive it.

import { z } from "zod";
import { getAnthropicClient, MODELS } from "@/lib/ai/anthropic-client";
import type { WritingSpec } from "@/lib/items";

const BAND = z.enum(["strong", "adequate", "limited"]);
export type Band = z.infer<typeof BAND>;

// ── HOW "NO ORGANISATION BAND" TRAVELS ON THE WIRE ──────────────────────────
// Tasks 51/52 have no organisation band. The obvious encoding is JSON null, and the obvious
// schema for it is what shipped first:
//
//     organization: { type: ["string", "null"], enum: ["strong", "adequate", "limited", null] }
//
// The API rejected that with a 400 on the FIRST real call — schema validation happens before
// inference, so it failed identically every time and no learner ever got feedback:
//
//     output_config.format.schema: Invalid schema:
//       Enum value 'strong' does not match declared type '['string', 'null']'
//
// The validator checks each enum value against the declared type and does not accept the
// array form of `type` alongside `enum`. The documented alternative is `anyOf`, which the
// structured-output docs do list as supported — but this uses a plain string enum with an
// explicit sentinel instead, because the three sibling properties below have exactly that
// shape and were accepted by the very request that rejected this one. That is proof against
// this API, this model and this account, rather than a second guess.
//
// The sentinel never escapes this module: Zod maps it straight back to null, so
// WritingFeedback.organization is still `Band | null` and nothing downstream changed.
const NOT_APPLICABLE = "not-applicable";

// Zod validates AFTER the model returns. The JSON schema sent to the API stays plainly typed:
// minimum/maximum/minItems/maxItems are rejected by the structured-output validator, so the
// shape is enforced there and the bounds are enforced here.
const feedbackSchema = z.object({
  contentAndTask: BAND,
  organization: z
    .union([BAND, z.literal(NOT_APPLICABLE), z.null()])
    .transform((v) => (v === NOT_APPLICABLE ? null : v)),
  languageUse: BAND,
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  overallComment: z.string(),
});
export type WritingFeedback = z.infer<typeof feedbackSchema>;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    contentAndTask: { type: "string", enum: ["strong", "adequate", "limited"] },
    organization: {
      type: "string",
      enum: ["strong", "adequate", "limited", NOT_APPLICABLE],
      description: `"${NOT_APPLICABLE}" for Tasks 51 and 52, which have no discourse to organise`,
    },
    languageUse: { type: "string", enum: ["strong", "adequate", "limited"] },
    strengths: { type: "array", items: { type: "string" }, description: "one to three, short and specific" },
    improvements: { type: "array", items: { type: "string" }, description: "one to three, short, specific and actionable" },
    overallComment: { type: "string", description: "one or two honest sentences" },
  },
  required: ["contentAndTask", "organization", "languageUse", "strengths", "improvements", "overallComment"],
  additionalProperties: false,
} as const;

// Exported so the offline proof can lint the REAL schema this module sends, not a copy of it.
// A copy would have agreed with itself right through the 400 that took this feature down.
export const WRITING_OUTPUT_SCHEMA: unknown = OUTPUT_SCHEMA;

const BAND_VALUE: Record<Band, number> = { strong: 1.0, adequate: 0.6, limited: 0.3 };

export type WritingScore = {
  /** 0–100. A practice estimate derived from the bands — never an official TOPIK mark. */
  estimate: number;
  feedback: WritingFeedback;
  chars: number;
  /** null when the task carries no band (51/52). */
  band: { min: number; max: number; withinBand: boolean } | null;
  telemetry: { model: string; latencyMs: number; inputTokens: number; outputTokens: number };
};

function charCount(text: string): number {
  // Count the way the composer's counter does, so the learner never sees two different
  // numbers for the same essay. Array.from respects code points, not UTF-16 units.
  return Array.from(text.trim()).length;
}

function buildSystem(taskNumber: number, hasOrganisation: boolean): string {
  return `You are an honest Writing assessor for AlmiKorean, a practice tool for TOPIK II 쓰기 (Task ${taskNumber}).

You are grading a written Korean response. Give your feedback in clear English; you may quote short Korean phrases.

ORIGINALITY: All AlmiKorean content is original. Never quote, paraphrase, or reproduce text from real TOPIK past papers or NIIED materials.

HONESTY: This is an AlmiKorean PRACTICE ESTIMATE, not an official TOPIK result. Real TOPIK 쓰기 is scored by trained human raters, and only NIIED awards an official score or level. Never claim the candidate has passed, never state or imply an official score or TOPIK level, and never inflate. Be constructive and specific.

${
    hasOrganisation
      ? `This task asks for a continuous piece of writing.`
      : `This task is a BLANK COMPLETION. The prompt contains two blanks, marked ( ㉠ ) and ( ㉡ ), and the candidate supplies the text that belongs in each. Expect two short pieces, not an essay. Judge each blank on whether it fits the surrounding sentence grammatically and in meaning, and whether it matches the register of the text around it. If only one blank has been attempted, say which one is missing.`
  }

Rate each criterion "strong", "adequate", or "limited":
- contentAndTask (내용 및 과제 수행): does the response do what the task asked, cover the required points, and stay on topic?
- languageUse (언어사용): grammar, vocabulary range and precision, spelling, and register — including whether the 문어체/격식체 expected by this task is sustained.${
    hasOrganisation
      ? `\n- organization (글의 전개 구조): is the writing organised and connected so it is easy to follow — clear progression, appropriate connectives?`
      : `\n- organization: return "${NOT_APPLICABLE}". Tasks 51 and 52 are short blank completions with no discourse to organise; do not invent a band for it.`
  }

Judge only what the candidate actually wrote. Do not reward intent that is not on the page, and do not penalise the candidate for anything the task did not ask for.

Banned words in your feedback: "weak", "poor", "wrong", "failed". Prefer plain, kind, specific guidance.`;
}

export async function evaluateWriting(input: {
  spec: WritingSpec;
  guidanceNote?: string;
  text: string;
}): Promise<WritingScore> {
  const { spec, guidanceNote, text } = input;
  const chars = charCount(text);
  const hasBand = spec.charMin != null && spec.charMax != null;
  const hasOrganisation = spec.taskNumber >= 53;

  const bandLine = hasBand
    ? `The candidate wrote ${chars} characters. This task requires ${spec.charMin}–${spec.charMax}자. (This count is measured, not estimated — do not recount it.)`
    : `The candidate wrote ${chars} characters. This task has no required length.`;

  const userMessage = `TOPIK II 쓰기 — Task ${spec.taskNumber}.
${bandLine}

TASK PROMPT:
${spec.prompt}
${spec.guidance ? `\nTASK GUIDANCE GIVEN TO THE CANDIDATE:\n${spec.guidance}` : ""}${
    guidanceNote ? `\n\nWHAT THIS TASK IS TESTING (author's note, for your calibration only — do not quote it back):\n${guidanceNote}` : ""
  }

CANDIDATE'S KOREAN RESPONSE:
${text}

Assess it against the criteria and return the JSON object.`;

  const client = getAnthropicClient();
  const started = Date.now();

  const msg = await client.messages.create({
    model: MODELS.OPUS,
    max_tokens: 16000,
    system: [{ type: "text", text: buildSystem(spec.taskNumber, hasOrganisation), cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    messages: [{ role: "user", content: userMessage }],
  });

  // A safety decline is a real outcome, not a parse failure — say so rather than
  // surfacing a confusing schema error.
  if (msg.stop_reason === "refusal") {
    throw new Error("The assessor declined to grade this response.");
  }

  const block = msg.content.find((c) => c.type === "text");
  if (!block || block.type !== "text") throw new Error("Assessor returned no text block");
  const feedback = feedbackSchema.parse(JSON.parse(block.text));

  // ── THE ESTIMATE, AND EXACTLY HOW IT IS DERIVED ──
  // Mean of the bands that apply to this task, scaled to 100. Tasks 51/52 average two
  // criteria, 53/54 average three. This is AlmiKorean's own formula, stated here so nobody
  // has to guess whether it claims to be NIIED's weighting. It does not.
  const bands: Band[] = hasOrganisation && feedback.organization
    ? [feedback.contentAndTask, feedback.organization, feedback.languageUse]
    : [feedback.contentAndTask, feedback.languageUse];
  let fraction = bands.reduce((s, b) => s + BAND_VALUE[b], 0) / bands.length;

  // Out-of-band length is penalised on the real exam, and a response far under the floor
  // cannot demonstrate the criteria at all. Deterministic, measured, and applied here rather
  // than asked of the model.
  let withinBand = true;
  if (hasBand) {
    const min = spec.charMin!;
    const max = spec.charMax!;
    withinBand = chars >= min && chars <= max;
    if (chars < min * 0.6) fraction *= 0.6;
    else if (!withinBand) fraction *= 0.85;
  }

  return {
    estimate: Math.round(Math.min(1, Math.max(0, fraction)) * 100),
    feedback,
    chars,
    band: hasBand ? { min: spec.charMin!, max: spec.charMax!, withinBand } : null,
    telemetry: {
      model: MODELS.OPUS,
      latencyMs: Date.now() - started,
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
    },
  };
}
