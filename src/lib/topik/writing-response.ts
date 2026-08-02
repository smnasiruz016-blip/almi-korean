// The shape /api/ko/writing returns, and a CHECK for it — same discipline as
// graded-response.ts, and for the same reason: a cast would let a proxy error page or a
// deploy skew render as blank bands and a "0" estimate that looks like a verdict on the
// learner's Korean. Feedback that arrives malformed must read as "something went wrong",
// never as a low mark.
//
// Client-safe: no node imports, no SDK import. The grader module pulls in @anthropic-ai/sdk,
// so the composer must NOT import its types from there — that would drag the SDK into the
// browser bundle. These types are declared here instead and the two are kept in step by the
// route, which returns exactly this.

export type Band = "strong" | "adequate" | "limited";

export type WritingFeedbackBody = {
  contentAndTask: Band;
  /** null for Tasks 51/52 — blank completions have no discourse to organise. */
  organization: Band | null;
  languageUse: Band;
  strengths: string[];
  improvements: string[];
  overallComment: string;
};

export type WritingGraded = {
  ok: true;
  taskNumber: number;
  /** 0–100 PRACTICE ESTIMATE. Never an official TOPIK score — the UI must say so. */
  estimate: number;
  chars: number;
  band: { min: number; max: number; withinBand: boolean } | null;
  feedback: WritingFeedbackBody;
};

const BANDS = new Set(["strong", "adequate", "limited"]);
const isBand = (v: unknown): v is Band => typeof v === "string" && BANDS.has(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === "string");

function asFeedback(v: unknown): WritingFeedbackBody | null {
  if (typeof v !== "object" || v === null) return null;
  const f = v as Record<string, unknown>;
  if (!isBand(f.contentAndTask) || !isBand(f.languageUse)) return null;
  if (f.organization !== null && !isBand(f.organization)) return null;
  if (!isStringArray(f.strengths) || !isStringArray(f.improvements)) return null;
  if (typeof f.overallComment !== "string") return null;
  return {
    contentAndTask: f.contentAndTask,
    organization: f.organization,
    languageUse: f.languageUse,
    strengths: f.strengths,
    improvements: f.improvements,
    overallComment: f.overallComment,
  };
}

function asCharBand(v: unknown): WritingGraded["band"] {
  if (v === null || v === undefined) return null;
  if (typeof v !== "object") return null;
  const b = v as Record<string, unknown>;
  if (typeof b.min !== "number" || typeof b.max !== "number" || typeof b.withinBand !== "boolean") return null;
  return { min: b.min, max: b.max, withinBand: b.withinBand };
}

/** Narrow an unknown reply to WritingGraded, or null if it is not one. */
export function asWritingGraded(v: unknown): WritingGraded | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (o.ok !== true) return null;
  if (typeof o.taskNumber !== "number" || typeof o.estimate !== "number" || typeof o.chars !== "number") return null;
  const feedback = asFeedback(o.feedback);
  if (!feedback) return null;
  // A band that arrives malformed is dropped to null rather than rejecting the whole reply:
  // it is presentational, and the criteria feedback is the thing the learner came for.
  return { ok: true, taskNumber: o.taskNumber, estimate: o.estimate, chars: o.chars, band: asCharBand(o.band), feedback };
}
