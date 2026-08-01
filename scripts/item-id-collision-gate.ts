// ITEM-ID COLLISION GATE — build-blocking.
//
//   npx tsx scripts/item-id-collision-gate.ts        the real bank (must be clean)
//   npx tsx scripts/item-id-collision-gate.ts --red  a synthetic duplicate (must fail)
//
// stableItemId hashes {track, section, title} — the same tuple as KoreanItem's
// @@unique([track, section, title]). Two items sharing it would do more than break grading:
// the seed's upsert would silently MERGE them into one row, so one item would vanish from the
// database with nothing raised anywhere, and /api/ko/submit would mark answers against the
// survivor's key.
//
// --red runs the same pure predicate over a list containing a deliberate duplicate, so the
// failing branch stays executable without ever editing the authored bank.

import { BANK, findIdCollisions, stableItemId } from "../src/lib/items";

const RED = process.argv.includes("--red");
const items = RED ? [...BANK, { ...BANK[0] }] : BANK;
const label = RED ? "SYNTHETIC (bank + a deliberate duplicate of item 0)" : "REAL BANK";

const collisions = findIdCollisions(items);
const ids = new Set(items.map((it) => stableItemId(it)));

console.log(`\n=== item-id collision gate — ${label} ===`);
console.log(`${items.length} item(s) · ${ids.size} distinct stable id(s)`);

if (collisions.length > 0) {
  console.error(`\n✗ ${collisions.length} collision(s):`);
  for (const c of collisions) console.error("  ✗ " + c);
  process.exit(1);
}
console.log(`\n✓ every item has its own stable id — the seed cannot merge two items, and grading cannot key against the wrong one`);
