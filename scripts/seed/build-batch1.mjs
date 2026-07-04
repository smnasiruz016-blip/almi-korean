// AlmiKorean — Batch-1 builder + integrity gates. Run: npm run build:batch1
// Reads per-bucket raw JSON (scripts/seed/raw/<bucket>.json), injects track/section from the
// bucket, enforces the LAW gates, and emits the flat bank to src/data/items-batch1.json (the
// bundled bank the app + seeder read) and scripts/seed/gen/batch1.json. Fails loud on any breach.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const RAW = join(HERE, "raw");
const GEN = join(HERE, "gen");

const BUCKETS = [
  { file: "topik-i-listening.json", track: "TOPIK_I", section: "LISTENING" },
  { file: "topik-i-reading.json", track: "TOPIK_I", section: "READING" },
  { file: "topik-ii-listening.json", track: "TOPIK_II", section: "LISTENING" },
  { file: "topik-ii-reading.json", track: "TOPIK_II", section: "READING" },
  { file: "topik-ii-writing.json", track: "TOPIK_II", section: "WRITING" },
];

const MIN_PER_BUCKET = 16;
const DIFFS = ["FOUNDATION", "CORE", "STRETCH"];
const TASK_TYPES = ["MCQ", "MATCHING", "ORDERING", "CLOZE", "WRITING"];
const WRITING_BANDS = { 53: { min: 200, max: 300 }, 54: { min: 600, max: 700 } };
const HANGUL = /[가-힣]/;

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const all = [];
const seenTitles = new Set();

for (const b of BUCKETS) {
  const path = join(RAW, b.file);
  if (!existsSync(path)) { fail(`[${b.file}] missing raw file`); continue; }
  let items;
  try { items = JSON.parse(readFileSync(path, "utf8")); }
  catch (e) { fail(`[${b.file}] invalid JSON: ${e.message}`); continue; }
  if (!Array.isArray(items)) { fail(`[${b.file}] must be a JSON array`); continue; }

  if (items.length < MIN_PER_BUCKET) fail(`[${b.file}] has ${items.length} items, need >= ${MIN_PER_BUCKET}`);

  const diffSeen = new Set();
  const writingTasks = {};

  items.forEach((it, i) => {
    const where = `[${b.track}/${b.section}#${i} "${it.title ?? "?"}"]`;
    // inject track/section from the bucket (single source of truth)
    it.track = b.track;
    it.section = b.section;

    if (!it.title || typeof it.title !== "string" || it.title.length < 3) fail(`${where} missing/short title`);
    if (it.title) {
      if (seenTitles.has(it.title)) fail(`${where} duplicate title (dedup key {track,section,title})`);
      seenTitles.add(it.title);
    }
    if (!DIFFS.includes(it.difficulty)) fail(`${where} bad difficulty ${it.difficulty}`);
    else diffSeen.add(it.difficulty);
    if (!TASK_TYPES.includes(it.taskType)) fail(`${where} bad taskType ${it.taskType}`);
    if (!it.payload || typeof it.payload !== "object") { fail(`${where} missing payload`); return; }

    if (b.section === "LISTENING" || b.section === "READING") {
      const qs = it.payload.questions;
      if (!Array.isArray(qs) || qs.length === 0) { fail(`${where} needs payload.questions`); return; }
      qs.forEach((q) => {
        if (!Array.isArray(q.options) || q.options.length < 2) fail(`${where} q${q.id} needs >=2 options`);
        const ids = (q.options ?? []).map((o) => o.id);
        if (new Set(ids).size !== ids.length) fail(`${where} q${q.id} duplicate option ids`);
        if (!ids.includes(q.answer)) fail(`${where} q${q.id} answer "${q.answer}" not an option id`);
        if (!HANGUL.test(q.stem ?? "")) warn(`${where} q${q.id} stem has no hangul`);
      });
      if (b.section === "READING" && !(Array.isArray(it.payload.passages) && it.payload.passages.length)) fail(`${where} READING needs payload.passages`);
      if (b.section === "LISTENING" && !it.payload.audioScript) fail(`${where} LISTENING needs payload.audioScript`);
      if (b.section === "READING" && it.payload.passages && !it.payload.passages.some((p) => HANGUL.test(p.body ?? ""))) warn(`${where} no hangul in passages`);
      if (b.section === "LISTENING" && !HANGUL.test(it.payload.audioScript ?? "")) warn(`${where} audioScript has no hangul`);
    }

    if (b.section === "WRITING") {
      const w = it.payload.writing;
      if (!w) { fail(`${where} WRITING needs payload.writing`); return; }
      if (![51, 52, 53, 54].includes(w.taskNumber)) fail(`${where} bad writing.taskNumber ${w.taskNumber}`);
      else writingTasks[w.taskNumber] = (writingTasks[w.taskNumber] ?? 0) + 1;
      if (!HANGUL.test(w.prompt ?? "")) warn(`${where} writing prompt has no hangul`);
      const band = WRITING_BANDS[w.taskNumber];
      if (band) { if (w.charMin !== band.min || w.charMax !== band.max) fail(`${where} Task ${w.taskNumber} band must be ${band.min}-${band.max} (got ${w.charMin}-${w.charMax})`); }
      else if (w.charMin != null || w.charMax != null) warn(`${where} Task ${w.taskNumber} should not carry a char band`);
    }

    all.push(it);
  });

  // difficulty spread gate (objective buckets need all three tiers)
  if (b.section !== "WRITING") {
    for (const d of DIFFS) if (!diffSeen.has(d)) fail(`[${b.track}/${b.section}] missing difficulty tier ${d}`);
  } else {
    // writing bucket: each task 51–54 needs >= 4
    for (const t of [51, 52, 53, 54]) if ((writingTasks[t] ?? 0) < 4) fail(`[writing] Task ${t} has ${writingTasks[t] ?? 0}, need >= 4`);
  }
}

// summary
const byBucket = {};
for (const it of all) byBucket[`${it.track}:${it.section}`] = (byBucket[`${it.track}:${it.section}`] ?? 0) + 1;

console.log("=== Batch-1 build ===");
for (const b of BUCKETS) console.log(`  ${b.track}/${b.section}: ${byBucket[`${b.track}:${b.section}`] ?? 0}`);
console.log(`  TOTAL: ${all.length}`);
if (warnings.length) { console.log(`\n${warnings.length} warning(s):`); warnings.slice(0, 20).forEach((w) => console.log("  ⚠", w)); }

if (errors.length) {
  console.error(`\n✗ ${errors.length} gate failure(s):`);
  errors.slice(0, 40).forEach((e) => console.error("  ✗", e));
  process.exit(1);
}

mkdirSync(GEN, { recursive: true });
writeFileSync(join(GEN, "batch1.json"), JSON.stringify(all, null, 2));
writeFileSync(join(ROOT, "src", "data", "items-batch1.json"), JSON.stringify(all, null, 2));
console.log(`\n✓ gates passed — wrote ${all.length} items to src/data/items-batch1.json + scripts/seed/gen/batch1.json`);
