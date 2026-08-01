// AlmiKorean — deterministic per-question option shuffle (anti-gaming, DoD #4).
//
// WHY THIS EXISTS
// The authored bank keys 60% of its 85 objective questions to option "b" and NEVER keys
// option "d" (0/85). A learner who reads nothing and always picks the second option scores
// 60%; one who merely eliminates the fourth option lifts blind chance from 25% to 33%.
// That is a position leak, not a content flaw — so it is fixed at the serving seam, not by
// rewriting 85 items.
//
// HOW
// Every question's options are permuted by a PRNG seeded from `${itemTitle}:${questionId}`.
// Both halves are stable, content-independent identifiers: all 92 bank titles match
// ^(TI|TII)-(L|R|W)-NN-slug$ and are unique (the seeder's dedup key is {track,section,title}),
// and question ids are unique within their item. The composite is unique across all 85
// questions — verified by scripts/answer-position-gate.ts.
//
// WHAT SURVIVES THE PERMUTATION
// The option id travels with its own text, because `id` is a property of the option object.
// Grading compares `chosen.id === question.answer`, so the key is never relocated and never
// needs rewriting. Authored position becomes a render-time decision that no author can lean on.
//
// WHAT THIS DOES NOT FIX
// The answer key still ships inside the page payload (audit A2/A4, both P0). Shuffling kills
// blind position-gaming; it does not stop a learner reading the bundle. That needs the
// server-authoritative grade route, which is a separate change.
//
// DETERMINISM CONTRACT
// Pure: no Date, no Math.random. Server and client derive the identical permutation from the
// same seed, so React hydration cannot mismatch, and the build-time gate measures exactly the
// order a learner is served rather than a reimplementation of it.

/** xmur3 — string → well-mixed 32-bit seed. */
function xmur3(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 — small, fast, well-distributed PRNG over [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The seed a question's permutation is derived from. Exported so the gate can assert uniqueness. */
export function seedKey(itemTitle: string, questionId: string): string {
  return `${itemTitle}:${questionId}`;
}

/**
 * Deterministically permute a question's options.
 *
 * Uniform Fisher–Yates over the WHOLE option list — not just the key's slot. A key-only move
 * would leave the distractors in authored order, and distractor order is itself an authored
 * pattern a learner can read.
 *
 * Returns a new array; the input is never mutated.
 */
export function shuffledOptions<T>(itemTitle: string, questionId: string, options: readonly T[]): T[] {
  const out = options.slice();
  const rand = mulberry32(xmur3(seedKey(itemTitle, questionId)));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
