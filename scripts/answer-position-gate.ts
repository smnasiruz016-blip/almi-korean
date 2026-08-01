// AlmiKorean — answer-position gate (port of audit B1/B1c, moved to the SERVED order).
//
//   npx tsx scripts/answer-position-gate.ts              measure what a learner is served (default)
//   npx tsx scripts/answer-position-gate.ts --authored   measure the raw bank order (RED proof)
//
// WHY IT MEASURES SERVED ORDER, NOT THE FILE
// src/lib/topik/shuffle.ts decides rendered option order at the serving seam. A gate that reads
// authored JSON would therefore be measuring a number no learner ever sees: red while the product
// is fixed, and — the dangerous half — green later if someone re-leans the *serving* code while
// the file still looks balanced. So this gate imports the very function the components call.
// One source of truth, or the gate proves the key rather than the world.
//
// --authored exists so the gate can be SEEN RED on demand against real data. A gate whose red
// branch has never executed is not a gate.
//
// RULES (a scope = a bucket of questions whose key positions are pooled)
//   R1 EXTREME  n >= 3  and top position >= 80%      — a tiny bucket that is effectively one answer
//   R2 SPREAD   n >= 10 and top position >  60%      — a big bucket with a readable lean
//   R3 DEAD     n >= 20, uniform option count, and some position keyed 0 times
//               — eliminating a never-correct option raises blind chance; audit H1r is per-family
//                 and does not see a position dead across a whole scope.
//   R4 SEED     every `${title}:${q.id}` distinct, and every permutation preserves the option
//               multiset and keeps the key resolvable — the shuffle must not lose or move a key.
//
// Scopes measured: fine {track::section::taskType}, coarse {track::section}, and BANK-WIDE.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { shuffledOptions, seedKey } from "../src/lib/topik/shuffle";

type Option = { id: string; text: string };
type Question = { id: string; stem: string; options: Option[]; answer: string };
type Item = {
  track: string;
  section: string;
  taskType: string;
  title: string;
  payload: { questions?: Question[] };
};

const HERE = dirname(fileURLToPath(import.meta.url));
const BANK: Item[] = JSON.parse(readFileSync(join(HERE, "..", "src", "data", "items-batch1.json"), "utf8"));

const AUTHORED = process.argv.includes("--authored");
const MODE = AUTHORED ? "AUTHORED (raw bank order)" : "SERVED (post-shuffle, what a learner sees)";

const R1_MIN_N = 3;
const R1_SHARE = 0.8;
const R2_MIN_N = 10;
const R2_SHARE = 0.6;
const R3_MIN_N = 20;

const failures: string[] = [];

// ── collect every objective question in the order it is actually rendered ───────────────
type Row = { scopeFine: string; scopeCoarse: string; idx: number; k: number };
const rows: Row[] = [];
const seeds = new Map<string, string>();

for (const it of BANK) {
  for (const q of it.payload.questions ?? []) {
    if (!Array.isArray(q.options) || q.options.length < 2) continue;

    // R4 — the seed must identify the question, and the permutation must be lossless.
    const key = seedKey(it.title, q.id);
    const prior = seeds.get(key);
    if (prior) failures.push(`R4 SEED  collision "${key}" — shared by "${prior}" and "${it.title}"`);
    seeds.set(key, it.title);

    const served = shuffledOptions(it.title, q.id, q.options);
    const authoredIds = q.options.map((o) => o.id).slice().sort().join(",");
    const servedIds = served.map((o) => o.id).slice().sort().join(",");
    if (authoredIds !== servedIds) {
      failures.push(`R4 SEED  "${key}" — permutation changed the option set (${authoredIds} → ${servedIds})`);
    }
    if (!served.some((o) => o.id === q.answer)) {
      failures.push(`R4 SEED  "${key}" — key "${q.answer}" does not resolve after permutation`);
    }
    // determinism: the same seed must give the same order twice, or SSR and the client diverge.
    if (served.map((o) => o.id).join(",") !== shuffledOptions(it.title, q.id, q.options).map((o) => o.id).join(",")) {
      failures.push(`R4 SEED  "${key}" — permutation is not deterministic`);
    }

    const order = AUTHORED ? q.options : served;
    rows.push({
      scopeFine: `${it.track}::${it.section}::${it.taskType}`,
      scopeCoarse: `${it.track}::${it.section}`,
      idx: order.findIndex((o) => o.id === q.answer),
      k: q.options.length,
    });
  }
}

// ── measure ────────────────────────────────────────────────────────────────────────────
const LABEL = ["a", "b", "c", "d", "e", "f"];

function judge(scope: string, group: Row[], grain: string): void {
  const n = group.length;
  const counts = new Map<number, number>();
  for (const r of group) counts.set(r.idx, (counts.get(r.idx) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const share = top[1] / n;

  const ks = new Set(group.map((r) => r.k));
  const uniformK = ks.size === 1 ? [...ks][0] : null;
  const dist = uniformK
    ? Array.from({ length: uniformK }, (_, i) => `slot ${LABEL[i]}=${counts.get(i) ?? 0}`).join("  ")
    : [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([i, c]) => `slot ${LABEL[i]}=${c}`).join("  ");

  console.log(`  ${scope.padEnd(40)} n=${String(n).padEnd(3)} ${dist}   top=${Math.round(share * 100)}%`);

  if (n >= R1_MIN_N && share >= R1_SHARE) {
    failures.push(`R1 EXTREME  [${grain}] ${scope} — ${Math.round(share * 100)}% of ${n} keyed to slot ${LABEL[top[0]]}`);
  } else if (n >= R2_MIN_N && share > R2_SHARE) {
    failures.push(`R2 SPREAD   [${grain}] ${scope} — ${Math.round(share * 100)}% of ${n} keyed to slot ${LABEL[top[0]]}`);
  }
  if (uniformK && n >= R3_MIN_N) {
    for (let i = 0; i < uniformK; i++) {
      if ((counts.get(i) ?? 0) === 0) {
        failures.push(`R3 DEAD     [${grain}] ${scope} — slot ${LABEL[i]} is never the answer across ${n} question(s)`);
      }
    }
  }
}

function groupBy(sel: (r: Row) => string): Map<string, Row[]> {
  const m = new Map<string, Row[]>();
  for (const r of rows) (m.get(sel(r)) ?? m.set(sel(r), []).get(sel(r))!).push(r);
  return new Map([...m.entries()].sort());
}

console.log(`\n=== answer-position gate — ${MODE} ===`);
console.log(`${rows.length} objective question(s) · ${seeds.size} distinct seed(s)\n`);

console.log("BANK-WIDE");
judge("(whole bank)", rows, "bank");

console.log("\nCOARSE  {track::section}");
for (const [scope, g] of groupBy((r) => r.scopeCoarse)) judge(scope, g, "coarse");

console.log("\nFINE  {track::section::taskType}");
for (const [scope, g] of groupBy((r) => r.scopeFine)) judge(scope, g, "fine");

// ── verdict ────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`\n✗ answer-position gate FAILED — ${failures.length} breach(es) in ${MODE}:`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\n✓ answer-position gate passed — no scope leaks the key from its position (${MODE})`);
