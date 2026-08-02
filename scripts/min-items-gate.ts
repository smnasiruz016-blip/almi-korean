// MIN-ITEMS GATE — the DoD floor of 15 items, enforced at SKILL grain.
//
// ── WHICH AXIS, AND WHY THAT ONE ──
// The Definition of Done sets a floor of 15 items per SKILL — one {track × section} pair. That
// is the axis a learner actually meets: they open "TOPIK II Reading" and get whatever is in it.
//
// The finer axis, {track × section × taskType}, is NOT enforced, and that is a deliberate
// decision rather than an oversight. Enforcing it today would fail 8 of 11 buckets —
// TOPIK_I::READING::MATCHING has one item, ORDERING has one — and the only way to go green
// would be to author ~70 new items. A gate that cannot pass is not a standard, it is a broken
// build, and the usual next step is that someone deletes the gate.
//
// So the finer axis is REPORTED on every run instead of enforced. The network has learned this
// the hard way (feedback_status_aggregate_masks_thin_modules): an aggregate that passes can
// hide a thin bucket underneath it. Printing the breakdown means the thinness is visible in
// the build log even while the floor it must clear is the coarser one — nobody has to go
// looking to find out that MATCHING has one item.
//
// Run:  npm run gate:min-items
// RED:  npm run gate:min-items:red   (a synthetic thin skill — the gate must reject it)

import { BANK, type BankItem } from "../src/lib/items";

const FLOOR = 15;
const RED = process.argv.includes("--red");

type Count = { key: string; n: number };

function countBy(items: readonly BankItem[], keyOf: (i: BankItem) => string): Count[] {
  const m = new Map<string, number>();
  for (const i of items) m.set(keyOf(i), (m.get(keyOf(i)) ?? 0) + 1);
  return [...m].map(([key, n]) => ({ key, n })).sort((a, b) => a.key.localeCompare(b.key));
}

const skillOf = (i: BankItem) => `${i.track}::${i.section}`;
const taskOf = (i: BankItem) => `${i.track}::${i.section}::${i.taskType}`;

/** The check as a PURE function over any item list, so RED can be shown against a synthetic
 *  bank without ever editing the authored one. */
export function findThinSkills(items: readonly BankItem[]): Count[] {
  return countBy(items, skillOf).filter((c) => c.n < FLOOR);
}

// ── THE BANK UNDER TEST ──
// RED removes items from one real skill until it is under the floor. It builds a NEW array; the
// authored bank is never touched, and the id-collision gate is unaffected because no item is
// duplicated or renamed.
let bank: readonly BankItem[] = BANK;
if (RED) {
  const victim = countBy(BANK, skillOf)[0].key;
  let dropped = 0;
  bank = BANK.filter((i) => {
    if (skillOf(i) !== victim) return true;
    // keep only enough to land one BELOW the floor
    return ++dropped > 1 && dropped <= FLOOR - 1 + 1;
  });
  console.log(`=== min-items gate — RED (synthetic: "${victim}" thinned below ${FLOOR}) ===`);
} else {
  console.log(`=== min-items gate — SKILL grain, floor ${FLOOR} ===`);
}

const skills = countBy(bank, skillOf);
for (const c of skills) {
  console.log(`  ${String(c.n).padStart(3)}  ${c.key}${c.n < FLOOR ? `   ← UNDER ${FLOOR}` : ""}`);
}

// The finer axis — reported, never enforced. See the header for why.
console.log(`\n  per taskType (reported, NOT enforced — the DoD floor is the skill):`);
for (const c of countBy(bank, taskOf)) {
  console.log(`  ${String(c.n).padStart(3)}  ${c.key}${c.n < FLOOR ? "   · thin" : ""}`);
}

const thin = findThinSkills(bank);
if (thin.length > 0) {
  console.error(
    `\n✗ min-items gate FAILED — ${thin.length} skill(s) below the floor of ${FLOOR}:\n` +
      thin.map((c) => `    ${c.key} has ${c.n}`).join("\n") +
      `\n  A skill under ${FLOOR} cannot give a learner a varied set: they meet repeats inside one sitting,` +
      `\n  and the section score stops measuring the skill and starts measuring recall of our bank.`,
  );
  process.exit(RED ? 0 : 1); // RED expects the failure — exiting 0 proves the gate FIRED
}

if (RED) {
  console.error("\n✗ RED FAILED — the gate passed a bank that is under the floor. It is not a gate.");
  process.exit(1);
}
console.log(`\n✓ min-items gate passed — every skill has at least ${FLOOR} items (${skills.length} skills, ${bank.length} items).`);
