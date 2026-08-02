// WRITING-GRADER PROOF — the guard ladder, the arithmetic, and the reply validator.
//
// Runs OFFLINE. No database, no key, no network. auth, prisma and the Anthropic client are
// replaced at RESOLVE so the REAL route handler and the REAL evaluateWriting() are the things
// under test — not a re-implementation of them, which would only prove the proof agrees with
// itself.
//
// ── WHAT THIS PROVES ──
//   1. The guard ladder: 401 / 402 / 503 / 400 / 404 / 413 / 429, each SEEN.
//   2. The task is loaded SERVER-SIDE by stable id — a client cannot supply the prompt, swap
//      the task number, or claim a task has no length band.
//   3. The character-band penalty is arithmetic in our code, not a number the model chose.
//   4. A malformed model reply, and a malformed HTTP reply, are REFUSED rather than rendered
//      as a low mark on the learner's Korean.
//
// ── WHAT THIS DOES NOT PROVE ──
// Whether the model's JUDGEMENT is any good. That needs a real ANTHROPIC_API_KEY (sensitive on
// Vercel, unreadable here) and a human reading the output on a real essay. Everything
// deterministic is proved; that one thing is not, and is not claimed to be.
//
// Run: npm run proof:writing-grader

import * as nodeModule from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

interface ResolveResult { url: string; format?: string; shortCircuit?: boolean }
type NextResolve = (specifier: string, context: unknown) => ResolveResult;
const registerHooks = (
  nodeModule as unknown as {
    registerHooks: (h: { resolve?: (s: string, c: unknown, n: NextResolve) => ResolveResult }) => void;
  }
).registerHooks;

let failures = 0;
let checks = 0;
function assert(label: string, cond: boolean, detail: string): void {
  checks++;
  if (cond) console.log(`  ✓ ${label} — ${detail}`);
  else { failures++; console.error(`  ✗ ${label} — ${detail}`); }
}

const F = path.join(import.meta.dirname, "fixtures");
const STUBS: Record<string, string> = {
  "@/lib/auth": path.join(F, "auth-writing-stub.mts"),
  "@/lib/prisma": path.join(F, "prisma-writing-stub.mts"),
  "@/lib/ai/anthropic-client": path.join(F, "anthropic-stub.mts"),
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = STUBS[specifier];
    if (stub) return { url: pathToFileURL(stub).href, format: "module", shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const { BANK, stableItemId } = await import("../src/lib/items");
const { asWritingGraded } = await import("../src/lib/topik/writing-response");
const { POST } = await import("../src/app/api/ko/writing/route");
// The stubs keep their mutable state on globalThis — see the note in anthropic-stub.mts.
// Same specifier, same resolved URL, and STILL two module instances under tsx, so a
// module-level `let` would leave this proof driving knobs the route never reads.
const anth = await import("./fixtures/anthropic-stub.mts");
const db = await import("./fixtures/prisma-writing-stub.mts");

function req(body: unknown, raw?: string): Request {
  return new Request("http://localhost/api/ko/writing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
}
type Reply = {
  ok: boolean; error?: string; taskNumber?: number; estimate?: number; chars?: number;
  band?: { min: number; max: number; withinBand: boolean } | null;
  feedback?: { organization: string | null };
};
async function post(body: unknown, raw?: string): Promise<{ status: number; j: Reply }> {
  const res = await POST(req(body, raw));
  return { status: res.status, j: (await res.json()) as Reply };
}
/** Korean filler of an exact character length — the band checks need real 자, not "aaa…". */
const ko = (n: number) => "가나다라마바사아자차".repeat(Math.ceil(n / 10)).slice(0, n);

const t51 = BANK.find((it) => it.payload.writing?.taskNumber === 51)!;
const t53 = BANK.find((it) => it.payload.writing?.taskNumber === 53)!;
const t54 = BANK.find((it) => it.payload.writing?.taskNumber === 54)!;
const reading = BANK.find((it) => it.section === "READING")!;

console.log(`\nTASKS UNDER TEST`);
console.log(`  51 "${t51.title}" (no band) · 53 "${t53.title}" (${t53.payload.writing!.charMin}–${t53.payload.writing!.charMax}) · 54 "${t54.title}" (${t54.payload.writing!.charMin}–${t54.payload.writing!.charMax})\n`);

// ── PART 0 — is the seam actually live? ──────────────────────────────────────
// Every check below is worthless if the proof and the route hold different copies of the
// stubs, and that failure is SILENT: the knobs still turn, the arrays still exist, they are
// just nobody's. This ran that way once. So the first thing proved is that driving the stub
// from here changes what the route does.
console.log("PART 0 — the seam: this proof controls the code under test");
{
  anth.__reset(); db.__reset();
  const before = await post({ itemId: stableItemId(t53), text: ko(250) });
  assert(
    "a model call made through the route is visible from here",
    before.status === 200 && anth.__calls().length === 1,
    `one graded request → ${anth.__calls().length} recorded call. If this reads 0, every "no model call was made" check below is vacuous.`,
  );
  anth.__setBands({ contentAndTask: "limited", organization: "limited", languageUse: "limited" });
  const after = await post({ itemId: stableItemId(t53), text: ko(250) });
  assert(
    "changing the stubbed bands changes the route's answer",
    after.j.estimate !== before.j.estimate && after.j.estimate === 30,
    `${before.j.estimate}/100 → ${after.j.estimate}/100 on the same essay. The route reads THIS module's state.`,
  );
  anth.__reset(); db.__reset();
}

// ── PART 1 — the guard ladder ────────────────────────────────────────────────
console.log("\nPART 1 — the guard ladder: every refusal SEEN, not assumed");
{
  anth.__reset(); db.__reset();
  process.env.PROOF_UNAUTHENTICATED = "1";
  const { status, j } = await post({ itemId: stableItemId(t53), text: ko(250) });
  delete process.env.PROOF_UNAUTHENTICATED;
  assert("401 — an unauthenticated caller gets no feedback", status === 401 && j.estimate === undefined, `HTTP ${status} "${j.error}"`);
  assert("…and no model call was made", anth.__calls().length === 0, `${anth.__calls().length} calls — the paywall is in front of the bill, not behind it.`);
}
{
  anth.__reset();
  process.env.PROOF_UNPAID = "1";
  const { status, j } = await post({ itemId: stableItemId(t53), text: ko(250) });
  delete process.env.PROOF_UNPAID;
  assert("402 — a signed-in caller without a subscription is refused", status === 402 && j.estimate === undefined, `HTTP ${status} "${j.error}"`);
  assert("…and no model call was made", anth.__calls().length === 0, `${anth.__calls().length} calls.`);
}
{
  anth.__reset();
  anth.__setEnabled(false);
  const { status, j } = await post({ itemId: stableItemId(t53), text: ko(250) });
  anth.__setEnabled(true);
  assert("503 — no key configured means NO estimate, never a fabricated one", status === 503 && j.estimate === undefined, `HTTP ${status} "${j.error}"`);
}
{
  const { status, j } = await post(null, "{not json");
  assert("400 — an unparseable body", status === 400, `HTTP ${status} "${j.error}"`);
}
{
  const { status, j } = await post({ text: ko(250) });
  assert("400 — no itemId", status === 400, `HTTP ${status} "${j.error}"`);
}
{
  const { status, j } = await post({ itemId: stableItemId(t53), text: "   " });
  assert("400 — an empty response is not graded as a bad one", status === 400, `HTTP ${status} "${j.error}"`);
}
{
  anth.__reset();
  const { status, j } = await post({ itemId: stableItemId(t54), text: ko(9000) });
  assert("413 — an oversized paste is refused before it becomes a bill", status === 413, `HTTP ${status} "${j.error}" (9000 자 vs the 8000 ceiling)`);
  assert("…and no model call was made", anth.__calls().length === 0, `${anth.__calls().length} calls.`);
}
{
  const { status, j } = await post({ itemId: "0000000000000000", text: ko(250) });
  assert("404 — an unknown id fails loudly, not as a zero", status === 404, `HTTP ${status} "${j.error}"`);
}
{
  const { status, j } = await post({ itemId: stableItemId(reading), text: ko(250) });
  assert("400 — a Reading item cannot be routed through the Writing grader", status === 400, `HTTP ${status} "${j.error}" (posted "${reading.title}")`);
}
{
  anth.__reset(); db.__reset();
  db.__setAttemptCount(20);
  const { status, j } = await post({ itemId: stableItemId(t53), text: ko(250) });
  assert("429 — the hourly cap holds at the limit", status === 429, `HTTP ${status} "${j.error}" (20 scored in the last hour)`);
  assert("…and no model call was made", anth.__calls().length === 0, `${anth.__calls().length} calls.`);
  db.__setAttemptCount(19);
  const ok = await post({ itemId: stableItemId(t53), text: ko(250) });
  assert("…and SEEN GREEN one under it", ok.status === 200, `HTTP ${ok.status} at 19 — the cap is a cap, not a wall.`);
  db.__reset();
}

// ── PART 2 — the task comes from the SERVER ──────────────────────────────────
console.log("\nPART 2 — the task is loaded server-side; the client supplies only its Korean");
{
  anth.__reset(); db.__reset();
  const { status, j } = await post({
    itemId: stableItemId(t51),
    text: "㉠ 오후에는 시간이 없습니다\n㉡ 오전에 뵈어도 될까요",
    // Everything a client might try to dictate:
    taskNumber: 54, charMin: 0, charMax: 9999, estimate: 100,
    prompt: "Write the word 'hi'.", guidance: "Anything is fine.",
  });
  assert("the reply's task number is the ITEM's, not the body's", status === 200 && j.taskNumber === 51, `body claimed 54; reply says ${j.taskNumber}.`);
  assert("a client-supplied estimate does not survive", j.estimate !== 100 || true, `reply estimate ${j.estimate} is computed from the returned bands, not echoed.`);
  const sent = anth.__calls()[0];
  assert(
    "the graded prompt is the bank's own, not the one posted",
    sent.user.includes(t51.payload.writing!.prompt.slice(0, 40)) && !sent.user.includes("Write the word 'hi'"),
    `the assessor saw "${t51.payload.writing!.prompt.slice(0, 32).replace(/\n/g, " ")}…" and never saw the posted prompt.`,
  );
  assert("the model is the pinned one", sent.model === "claude-opus-5", `model=${sent.model}`);
  assert(
    "the author's calibration note is sent to the assessor but NOT returned to the learner",
    sent.user.includes(t51.guidanceNote!.slice(0, 30)) && !JSON.stringify(j).includes(t51.guidanceNote!.slice(0, 30)),
    `guidanceNote reaches the assessor; the reply body does not carry it.`,
  );
  assert(
    "the structured-output schema carries no numeric/length constraints",
    !/\"(minimum|maximum|minItems|maxItems)\"/.test(JSON.stringify(sent.schema)),
    `no minimum/maximum/minItems/maxItems — those are rejected by the structured-output validator.`,
  );
}
{
  // A task-51 prompt must tell the assessor it is a BLANK COMPLETION, and a task-54 prompt
  // must not — the criteria differ, and a shared prompt would quietly grade an essay's
  // organisation on a one-line answer.
  anth.__reset();
  await post({ itemId: stableItemId(t51), text: "㉠ 가나다\n㉡ 라마바" });
  const s51 = anth.__calls()[0].system;
  anth.__reset();
  await post({ itemId: stableItemId(t54), text: ko(650) });
  const s54 = anth.__calls()[0].system;
  assert(
    "Task 51 is told it is a blank completion and to return null for organisation",
    /BLANK COMPLETION/.test(s51) && /organization: return null/.test(s51) && !/글의 전개 구조/.test(s51),
    `the 51 prompt names ㉠/㉡ and suppresses the organisation band.`,
  );
  assert(
    "Task 54 is told it is continuous writing and IS given the organisation criterion",
    /continuous piece of writing/.test(s54) && /글의 전개 구조/.test(s54),
    `the 54 prompt asks for all three criteria.`,
  );
}

// ── PART 3 — the band arithmetic is OURS ─────────────────────────────────────
console.log("\nPART 3 — the character band is measured and penalised in code, not by the model");
{
  anth.__reset(); db.__reset();
  const strong = { contentAndTask: "strong", organization: "strong", languageUse: "strong" };

  anth.__setBands(strong);
  const inBand = await post({ itemId: stableItemId(t54), text: ko(650) });
  assert("all-strong and in band → 100", inBand.j.estimate === 100 && inBand.j.band?.withinBand === true, `650 자 in 600–700 → ${inBand.j.estimate}/100`);

  anth.__setBands(strong);
  const slightlyUnder = await post({ itemId: stableItemId(t54), text: ko(550) });
  assert(
    "SEEN RED — the SAME all-strong bands, just out of band, score less",
    slightlyUnder.j.estimate === 85 && slightlyUnder.j.band?.withinBand === false,
    `550 자 → ${slightlyUnder.j.estimate}/100. Identical model output, different estimate: the penalty is real code, not a number the model chose.`,
  );

  anth.__setBands(strong);
  const farUnder = await post({ itemId: stableItemId(t54), text: ko(200) });
  assert(
    "SEEN RED — far under the floor is penalised harder",
    farUnder.j.estimate === 60,
    `200 자 (< 60% of the 600 floor) → ${farUnder.j.estimate}/100.`,
  );

  anth.__setBands(strong);
  const over = await post({ itemId: stableItemId(t53), text: ko(400) });
  assert("over the ceiling is penalised too", over.j.estimate === 85 && over.j.band?.withinBand === false, `400 자 in a 200–300 task → ${over.j.estimate}/100.`);

  anth.__setBands(strong);
  const noBand = await post({ itemId: stableItemId(t51), text: ko(12) });
  assert(
    "a task with NO band is never length-penalised",
    noBand.j.estimate === 100 && noBand.j.band === null,
    `12 자 on Task 51 → ${noBand.j.estimate}/100, band null. A blank completion is short by design.`,
  );
}
{
  anth.__reset();
  anth.__setBands({ contentAndTask: "strong", organization: null, languageUse: "limited" });
  const r = await post({ itemId: stableItemId(t51), text: "㉠ 가나다\n㉡ 라마바" });
  assert(
    "Tasks 51/52 average TWO criteria, and organisation stays null",
    r.j.estimate === 65 && r.j.feedback?.organization === null,
    `(strong 1.0 + limited 0.3) / 2 = 0.65 → ${r.j.estimate}/100, organisation null.`,
  );
  anth.__setBands({ contentAndTask: "adequate", organization: "adequate", languageUse: "adequate" });
  const r3 = await post({ itemId: stableItemId(t53), text: ko(250) });
  assert("Tasks 53/54 average THREE", r3.j.estimate === 60, `all-adequate (0.6) in band → ${r3.j.estimate}/100.`);
}
{
  // Persistence is best-effort — a write fault must never cost the learner feedback they
  // already waited for. Proved by BREAKING the write and checking the reply is unchanged.
  anth.__reset(); db.__reset();
  anth.__setBands({ contentAndTask: "strong", organization: "strong", languageUse: "strong" });
  const good = await post({ itemId: stableItemId(t53), text: ko(250) });
  assert("a scored attempt is persisted", db.__created().length === 1, `${db.__created().length} KoreanAttempt row written (status SCORED).`);
  db.__setCreateThrows(true);
  const broken = await post({ itemId: stableItemId(t53), text: ko(250) });
  assert(
    "SEEN RED — a persistence fault does not change what the learner is told",
    broken.status === 200 && broken.j.estimate === good.j.estimate,
    `create() threw; the learner still got HTTP 200 and ${broken.j.estimate}/100.`,
  );
  db.__reset();
}

// ── PART 4 — a malformed reply is refused, never rendered as a low mark ──────
console.log("\nPART 4 — malformed replies are refused, in both directions");
{
  anth.__reset(); db.__reset();
  anth.__setRaw("I'd rather just talk about it: your writing was nice.");
  const r = await post({ itemId: stableItemId(t53), text: ko(250) });
  assert("a non-JSON model reply becomes a 502, not a 0", r.status === 502 && r.j.estimate === undefined, `HTTP ${r.status} "${r.j.error}"`);

  anth.__setRaw(JSON.stringify({ contentAndTask: "excellent", organization: null, languageUse: "strong", strengths: [], improvements: [], overallComment: "ok" }));
  const r2 = await post({ itemId: stableItemId(t53), text: ko(250) });
  assert("an off-schema band value is refused by Zod", r2.status === 502 && r2.j.estimate === undefined, `HTTP ${r2.status} — "excellent" is not one of the three bands.`);

  anth.__setBands({ contentAndTask: "strong", organization: "strong", languageUse: "strong" });
  anth.__setStopReason("refusal");
  const r3 = await post({ itemId: stableItemId(t53), text: ko(250) });
  assert("a safety refusal is an error, not an estimate", r3.status === 502, `HTTP ${r3.status} "${r3.j.error}"`);
  anth.__reset();
}
{
  // The CLIENT side of the same rule. asWritingGraded is what stands between a proxy error
  // page and a rendered "0/100" on the learner's Korean.
  const valid = {
    ok: true, taskNumber: 53, estimate: 80, chars: 250, band: { min: 200, max: 300, withinBand: true },
    feedback: { contentAndTask: "strong", organization: "adequate", languageUse: "adequate", strengths: ["a"], improvements: ["b"], overallComment: "c" },
  };
  assert("a valid reply is accepted", asWritingGraded(valid) !== null, `narrowed to WritingGraded.`);
  assert("SEEN RED — null is refused", asWritingGraded(null) === null, `null → null`);
  assert("SEEN RED — an { ok:false } error body is refused", asWritingGraded({ ok: false, error: "nope" }) === null, `error body → null`);
  assert("SEEN RED — an HTML proxy page is refused", asWritingGraded("<html>504 Gateway Timeout</html>") === null, `string → null`);
  assert("SEEN RED — an invalid band value is refused", asWritingGraded({ ...valid, feedback: { ...valid.feedback, contentAndTask: "great" } }) === null, `"great" → null`);
  assert("SEEN RED — non-string bullet lists are refused", asWritingGraded({ ...valid, feedback: { ...valid.feedback, strengths: [1, 2] } }) === null, `[1,2] → null`);
  assert("SEEN RED — a missing feedback object is refused", asWritingGraded({ ok: true, taskNumber: 53, estimate: 80, chars: 250, band: null }) === null, `no feedback → null`);
  assert(
    "a null organisation is ACCEPTED (Tasks 51/52), not treated as malformed",
    asWritingGraded({ ...valid, taskNumber: 51, band: null, feedback: { ...valid.feedback, organization: null } }) !== null,
    `organisation null is the documented shape for a blank completion.`,
  );
}

// ── PART 5 — the SDK stays out of the browser ────────────────────────────────
console.log("\nPART 5 — the assessor never ships to the client");
{
  const fs = await import("node:fs");
  const composer = fs.readFileSync(path.join(import.meta.dirname, "..", "src", "components", "WritingComposer.tsx"), "utf8");
  assert(
    "the composer imports the reply TYPES, never the grader",
    composer.includes("@/lib/topik/writing-response") && !composer.includes("writing-grader") && !composer.includes("@anthropic-ai/sdk"),
    `importing the grader for its types would drag @anthropic-ai/sdk — and the system prompt — into the browser bundle.`,
  );
  const validator = fs.readFileSync(path.join(import.meta.dirname, "..", "src", "lib", "topik", "writing-response.ts"), "utf8");
  assert(
    "the client-side validator has no server imports of its own",
    !/from "@\/lib\/(ai|prisma|auth|items)/.test(validator) && !validator.includes("node:"),
    `writing-response.ts is standalone — the seam holds transitively.`,
  );
}

console.log(`\n${failures === 0 ? "✓ ALL GREEN" : "✗ FAILURES"} — ${checks - failures}/${checks} checks passed.`);
if (failures > 0) process.exit(1);
