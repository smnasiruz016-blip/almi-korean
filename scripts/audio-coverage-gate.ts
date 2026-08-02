// AUDIO-COVERAGE GATE — build-blocking.
//
//   npx tsx scripts/audio-coverage-gate.ts                     the real manifest
//   AUDIO_MANIFEST=<path> npx tsx scripts/audio-coverage-gate.ts   a fixture, for proving the branches
//
// Every LISTENING item must have a clip. A listening section with a silent item is not a
// degraded experience, it is an unanswerable question — the learner is asked what the speaker
// said and given nothing to hear. So this fails the build rather than shipping a gap.
//
// ── WHY IT READS THE MANIFEST AND NOT THE DATABASE ──
// KoreanItem carries audioUrl too, and the upload script writes both. But this product's build
// is deliberately DB-free (Vercel runs `prisma generate && next build`, no connection), so a
// gate that needed DATABASE_URL would either be skipped on CI or make every build depend on
// Neon being up. A gate that gets skipped is not a gate. The manifest is committed and
// deterministic, so this check means the same thing on every machine.
//
// ── WHAT IT CHECKS ──
//   1. COVERAGE  every LISTENING item has a manifest entry — the 36/36 rule
//   2. ORPHANS   no manifest entry names an item that is not in the bank (a rename or a
//                deleted item leaves a clip pointing at nothing, and nobody would notice)
//   3. SHAPE     each entry has a usable https URL, a positive duration and a non-zero size —
//                an entry present but empty passes a naive count and still plays silence
//   4. NON-LISTENING items must NOT have a clip, so a stray upload cannot quietly attach audio
//      to a reading item

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Clip = { url: string; durationSec: number; voice: string; bytes: number };
type Manifest = { engine: string; bitrate: string; clips: Record<string, Clip> };
type Item = { track: string; section: string; title: string };

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const bank: Item[] = JSON.parse(readFileSync(join(ROOT, "src", "data", "items-batch1.json"), "utf8"));
const manifestPath = process.env.AUDIO_MANIFEST ?? join(ROOT, "src", "data", "audio-manifest.json");
const manifest: Manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const clips = manifest.clips ?? {};

const listening = bank.filter((i) => i.section === "LISTENING");
const other = bank.filter((i) => i.section !== "LISTENING");
const titles = new Set(bank.map((i) => i.title));

const missing: string[] = [];
const malformed: string[] = [];
const orphans: string[] = [];
const misplaced: string[] = [];

for (const it of listening) {
  const c = clips[it.title];
  if (!c) {
    missing.push(`${it.track}  ${it.title}`);
    continue;
  }
  const bad: string[] = [];
  if (typeof c.url !== "string" || !/^https?:\/\/\S+/.test(c.url)) bad.push(`url=${JSON.stringify(c.url)}`);
  if (!(typeof c.durationSec === "number" && c.durationSec > 0)) bad.push(`durationSec=${JSON.stringify(c.durationSec)}`);
  if (!(typeof c.bytes === "number" && c.bytes > 0)) bad.push(`bytes=${JSON.stringify(c.bytes)}`);
  if (bad.length) malformed.push(`${it.title} — ${bad.join(", ")}`);
}

for (const title of Object.keys(clips)) {
  if (!titles.has(title)) orphans.push(title);
}
for (const it of other) {
  if (clips[it.title]) misplaced.push(`${it.section}  ${it.title}`);
}

const covered = listening.length - missing.length;
console.log(`\n=== audio-coverage gate ===`);
console.log(`manifest: ${manifestPath.replace(ROOT, ".")}`);
console.log(`engine  : ${manifest.engine ?? "(unset)"} · ${manifest.bitrate ?? "?"}`);
console.log(`coverage: ${covered}/${listening.length} listening item(s) have a clip`);
console.log(`entries : ${Object.keys(clips).length} in manifest · ${orphans.length} orphan(s) · ${misplaced.length} on non-listening item(s)`);

const fail = missing.length + malformed.length + orphans.length + misplaced.length;
if (fail === 0) {
  const totalBytes = listening.reduce((a, it) => a + (clips[it.title]?.bytes ?? 0), 0);
  const totalSecs = listening.reduce((a, it) => a + (clips[it.title]?.durationSec ?? 0), 0);
  console.log(
    `\n✓ every listening item has a playable clip — ${(totalBytes / 1024 / 1024).toFixed(2)} MB, ` +
      `${Math.round(totalSecs / 60)} min of audio`,
  );
  process.exit(0);
}

console.error(`\n✗ audio-coverage gate FAILED — ${fail} problem(s):`);
if (missing.length) {
  console.error(`  ✗ ${missing.length} listening item(s) with NO clip — these questions are unanswerable:`);
  for (const m of missing.slice(0, 8)) console.error(`      ${m}`);
  if (missing.length > 8) console.error(`      … and ${missing.length - 8} more`);
}
for (const m of malformed) console.error(`  ✗ malformed entry: ${m}`);
for (const o of orphans) console.error(`  ✗ orphan clip — no item named "${o}" (renamed or deleted?)`);
for (const m of misplaced) console.error(`  ✗ clip attached to a non-listening item: ${m}`);
process.exit(1);
