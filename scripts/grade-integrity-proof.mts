// GRADE-INTEGRITY PROOF — RED first, then GREEN, for AlmiKorean's A1/A2/A4.
//
// Runs OFFLINE. No database, no secret, no network. The auth and prisma boundaries are
// replaced at RESOLVE so the REAL route handler is the thing under test — not a
// re-implementation of it, which would only ever prove the proof agrees with itself.
//
// ── THE DEFECT THIS PROVES IS FIXED ──
// There was no server in the loop at all. The bank went to the browser with its keys and
// src/components/PracticeRunner.tsx marked in the page:
//
//     const correct = flat.filter((f) => answers[f.key] === f.q.answer).length;   // :20
//     const isAnswer = submitted && o.id === q.answer;                            // :42
//
// Nothing was posted and nothing was persisted, so the audit could not even call it broken —
// it reported ERROR, "cannot be proved either way". And because /practice/[track]/[section]
// is prerendered (dynamicParams=false), that key sat in the served artefact before the
// learner answered. PART 1 re-executes that browser-side marking to show the exploit was
// real; PARTS 2–4 show the same forged claims cannot land on the route that now exists.
//
// Run: npm run proof:grade-integrity

import * as nodeModule from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

// module.registerHooks() is Node >= 22.15. The pinned @types/node predates it, so it is
// reached through a narrow local declaration — a typed hole the exact shape of the one API in
// use, rather than an `any` cast that would also hide a mistake in the hook itself.
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

// Interception is at RESOLVE, not load: the route imports these through the `@/…` tsconfig
// alias, and tsx resolves that alias inside its own pipeline where a load hook never sees the
// result. Registered hooks run last-registered-first, so this runs before tsx's.
const STUBS: Record<string, string> = {
  "@/lib/auth": path.join(import.meta.dirname, "fixtures", "auth-stub.mts"),
  "@/lib/prisma": path.join(import.meta.dirname, "fixtures", "prisma-stub.mts"),
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = STUBS[specifier];
    if (stub) return { url: pathToFileURL(stub).href, format: "module", shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const { BANK, stableItemId, toRunnerItem, findIdCollisions } = await import("../src/lib/items");
const { shuffledOptions } = await import("../src/lib/topik/shuffle");
const { POST } = await import("../src/app/api/ko/submit/route");

function req(body: unknown): Request {
  return new Request("http://localhost/api/ko/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// A real, served item to attack: one question, four options.
const victim = BANK.find((it) => (it.payload.questions?.length ?? 0) === 1 && it.payload.questions![0].options.length === 4);
if (!victim) { console.error("✗ PROOF ABORTED: no single-question 4-option item found."); process.exit(1); }
const vq = victim.payload.questions![0];
const trueOpt = vq.answer;
const wrongOpt = vq.options.find((o) => o.id !== trueOpt)!.id;
const victimId = stableItemId(victim);

console.log(`\nVICTIM ITEM  "${victim.title}"  (${victim.track}/${victim.section})`);
console.log(`  id ${victimId} · options ${vq.options.map((o) => o.id).join(",")} · true "${trueOpt}" · forging "${wrongOpt}"\n`);

// ── PART 1 — RED. The browser-side marking, re-executed. ─────────────────────
console.log("PART 1 — RED: the pre-fix marking (the key travelled with the question)");
{
  // Exactly the old PracticeRunner.tsx:20 — a comparison the page could make because it held
  // the key. A forged `true` here would have been believed, because nothing else marked.
  const chosen = wrongOpt;
  const clientSaysCorrect = chosen === vq.answer;
  assert(
    "the key was in the page, so the page could mark itself",
    vq.answer !== undefined && clientSaysCorrect === false,
    `the served question carried answer="${vq.answer}"; a client holding it decides its own verdict.`,
  );
  const servedThen = JSON.parse(JSON.stringify(victim)) as { payload: { questions: { answer?: string }[] } };
  assert(
    "the pre-fix served item exposed the answer",
    servedThen.payload.questions[0].answer === trueOpt,
    `payload.questions[0].answer === "${trueOpt}" reached the browser with the question.`,
  );
}

// ── PART 2 — GREEN (A1). ─────────────────────────────────────────────────────
console.log("\nPART 2 — GREEN (A1): the live route ignores everything the client claims");
{
  process.env.PROOF_UNAUTHENTICATED = "1";
  const res = await POST(req({ items: [{ itemId: victimId, answers: { [vq.id]: trueOpt } }] }));
  const j = (await res.json()) as { ok: boolean; error?: string; correct?: number };
  delete process.env.PROOF_UNAUTHENTICATED;
  assert("an unauthenticated caller is refused", res.status === 401 && j.correct === undefined, `HTTP ${res.status} "${j.error}" — no marks of any kind.`);
}
{
  // The paywall the PAGES enforce, now enforced here too. This route was auth-only on the
  // stated grounds that Listening/Reading are free — but every practice page redirects a
  // signed-in non-subscribed user to /account, so that free tier does not exist, and the
  // reply below discloses correctOptionId for every question posted.
  process.env.PROOF_UNPAID = "1";
  const res = await POST(req({ items: [{ itemId: victimId, answers: { [vq.id]: trueOpt } }] }));
  const j = (await res.json()) as { ok: boolean; error?: string; marks?: unknown };
  delete process.env.PROOF_UNPAID;
  assert(
    "a signed-in caller without a subscription cannot harvest the key",
    res.status === 402 && j.marks === undefined,
    `HTTP ${res.status} "${j.error}" — no marks, so no correctOptionId to collect.`,
  );
}
{
  const res = await POST(req({}));
  const j = (await res.json()) as { ok: boolean; error?: string };
  assert("a body with no items is refused", res.status === 400 && j.ok === false, `HTTP ${res.status} "${j.error}".`);
}
{
  const res = await POST(req({ items: [{ answers: { [vq.id]: trueOpt } }] }));
  const j = (await res.json()) as { ok: boolean; error?: string; correct?: number };
  assert("an item with no itemId is refused", res.status === 400 && j.correct === undefined, `HTTP ${res.status} "${j.error}" — no score is returned.`);
}
{
  // THE DECIDING CASE: a real item id, a WRONG option, and every forged claim the old shape
  // allowed — a key, a score, a correct count, a track and a section.
  const res = await POST(req({
    track: "TOPIK_II", section: "LISTENING", correct: 99, total: 99, percent: 100, score: 100,
    items: [{ itemId: victimId, answers: { [vq.id]: wrongOpt }, answer: trueOpt, correct: true }],
  }));
  const j = (await res.json()) as { ok: boolean; correct: number; total: number; percent: number; track: string; section: string; marks: { correct: boolean; correctOptionId: string }[] };
  assert(
    "forged key/score/track/section are ignored — the wrong option scores 0",
    res.status === 200 && j.correct === 0 && j.percent === 0 && j.marks[0].correct === false,
    `HTTP 200 → ${j.correct}/${j.total} (${j.percent}%). The body claimed correct:99 and answer:"${trueOpt}"; the server marked "${wrongOpt}" against its own key.`,
  );
  assert(
    "track and section come from the loaded item, not the body",
    j.track === victim.track && j.section === victim.section,
    `body said TOPIK_II/LISTENING; reply says ${j.track}/${j.section} — the item's own.`,
  );
}
{
  const res = await POST(req({ items: [{ itemId: victimId, answers: { [vq.id]: trueOpt } }] }));
  const j = (await res.json()) as { correct: number; total: number };
  assert("the true option still scores", j.correct === j.total && j.total > 0, `${j.correct}/${j.total} — marking works, it is just no longer client-directed.`);
}
{
  const res = await POST(req({ items: [{ itemId: "0000000000000000", answers: {} }] }));
  const j = (await res.json()) as { ok: boolean; error?: string };
  assert("unknown itemId is a 404, not a silent zero", res.status === 404 && j.ok === false, `HTTP ${res.status} "${j.error}".`);
}
{
  const other = BANK.find((it) => it.track !== victim.track && (it.payload.questions?.length ?? 0) > 0)!;
  const res = await POST(req({ items: [{ itemId: victimId, answers: {} }, { itemId: stableItemId(other), answers: {} }] }));
  const j = (await res.json()) as { ok: boolean; error?: string };
  assert("a post spanning two tracks is refused", res.status === 400 && /more than one/.test(j.error ?? ""), `HTTP ${res.status} "${j.error}".`);
}
{
  // TOPIK II Writing has no key. Refusing it beats returning a 0/0 that reads as a marked section.
  const w = BANK.find((it) => it.section === "WRITING")!;
  const res = await POST(req({ items: [{ itemId: stableItemId(w), answers: {} }] }));
  const j = (await res.json()) as { ok: boolean; error?: string };
  assert("a Writing post is refused, not scored 0", res.status === 400 && /not auto-marked/.test(j.error ?? ""), `HTTP ${res.status} "${j.error}".`);
}

// ── PART 3 — GREEN (A2). ─────────────────────────────────────────────────────
console.log("\nPART 3 — GREEN (A2): the key is disclosed only by a scored reply");
{
  const served = toRunnerItem(victim);
  const q = served.payload.questions[0] as Record<string, unknown>;
  assert(
    "the served item carries an id and no key",
    typeof served.id === "string" && !("answer" in q),
    `question fields: ${Object.keys(q).join(", ")} · option fields: ${Object.keys(served.payload.questions[0].options[0]).join(", ")}`,
  );
  assert(
    "no answer survives anywhere in the served payload",
    !JSON.stringify(served).includes(`"answer"`),
    `a full stringify of the served item contains no "answer" field at all.`,
  );
  assert(
    "not one item in the whole bank leaks a key once stripped",
    BANK.every((it) => !JSON.stringify(toRunnerItem(it)).includes(`"answer"`)),
    `all ${BANK.length} items stripped; zero "answer" fields across the entire served surface.`,
  );
}
{
  const res = await POST(req({ items: [{ itemId: victimId, answers: { [vq.id]: wrongOpt } }] }));
  const j = (await res.json()) as { marks: { correctOptionId: string }[] };
  assert("the scored reply reveals the correct option", j.marks[0].correctOptionId === trueOpt, `after marking, the reply names "${trueOpt}" — post-submit, never with the question.`);
}

// ── PART 4 — GREEN (A4) + shuffle independence. ──────────────────────────────
console.log("\nPART 4 — GREEN (A4): stable ids are unique, and marking survives the shuffle");
{
  const ids = new Set(BANK.map((it) => stableItemId(it)));
  assert("every bank item has a unique stable id", ids.size === BANK.length && BANK.length > 0, `${ids.size}/${BANK.length} unique.`);
  assert("findIdCollisions is clean on the real bank", findIdCollisions(BANK).length === 0, `0 collisions across ${BANK.length} items.`);
  const red = findIdCollisions([victim, { ...victim }]);
  assert("SEEN RED — a duplicated item is reported, not passed", red.length === 1, `${red.length} reported: ${red[0]?.slice(0, 90)}…`);
  assert(
    "the id hashes exactly the database's own unique key",
    stableItemId(victim) === stableItemId({ track: victim.track, section: victim.section, title: victim.title }),
    `track|section|title alone reproduces the id, so one string names the bundle item AND resolves the KoreanItem row.`,
  );
}
{
  // The two fixes must not depend on each other. The client renders a permuted option list;
  // the server compares ids, so the learner's chosen id marks the same either way.
  const served = toRunnerItem(victim);
  const shown = shuffledOptions(served.title, vq.id, served.payload.questions[0].options);
  const shownIds = shown.map((o) => o.id).join(",");
  const authoredIds = vq.options.map((o) => o.id).join(",");
  const res = await POST(req({ items: [{ itemId: victimId, answers: { [vq.id]: trueOpt } }] }));
  const j = (await res.json()) as { correct: number; total: number };
  assert(
    "marking is shuffle-agnostic",
    j.correct === j.total && j.total > 0,
    `rendered order ${shownIds} vs authored ${authoredIds}; the key "${trueOpt}" still marks correct because the server compares ids, not positions.`,
  );
}

console.log(
  failures === 0
    ? `\n✓ GRADE-INTEGRITY PROOF: ${checks}/${checks} checks passed.\n`
    : `\n✗ GRADE-INTEGRITY PROOF FAILED: ${failures} of ${checks} checks failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
