// The shape /api/ko/submit returns, and a CHECK for it rather than an assertion.
//
// `(await res.json()) as Graded` is a cast: it tells the compiler what the body is and asks
// the network to agree. A deploy skew, a proxy error page, or a route that starts returning
// { ok:false } on a path the caller forgot leaves `correct` undefined, and the runner renders
// "undefined/undefined correct" instead of saying something went wrong. Marking is the one
// thing in this product that must not be able to lie quietly, so the reply is validated at
// the boundary like any other untrusted input — this one just happens to come from us.
//
// Client-safe: no node imports, so both runners can use it.

export type Mark = { itemId: string; questionId: string; correct: boolean; correctOptionId: string };
export type Graded = { ok: true; correct: number; total: number; percent: number; marks: Mark[] };

function isMark(v: unknown): v is Mark {
  if (typeof v !== "object" || v === null) return false;
  const m = v as Record<string, unknown>;
  return (
    typeof m.itemId === "string" &&
    typeof m.questionId === "string" &&
    typeof m.correct === "boolean" &&
    typeof m.correctOptionId === "string"
  );
}

/** Narrow an unknown reply to Graded, or null if it is not one. */
export function asGraded(v: unknown): Graded | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (o.ok !== true) return null;
  if (typeof o.correct !== "number" || typeof o.total !== "number" || typeof o.percent !== "number") return null;
  if (!Array.isArray(o.marks) || !o.marks.every(isMark)) return null;
  return { ok: true, correct: o.correct, total: o.total, percent: o.percent, marks: o.marks };
}

/** The server's own error message when it sent one, else a caller-supplied fallback. */
export function errorFrom(v: unknown, fallback: string): string {
  if (typeof v === "object" && v !== null) {
    const e = (v as Record<string, unknown>).error;
    if (typeof e === "string" && e.trim()) return e;
  }
  return fallback;
}
