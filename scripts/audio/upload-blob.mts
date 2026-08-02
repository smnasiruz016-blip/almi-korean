// Upload the rendered listening clips to Vercel Blob and write the audio manifest.
//
//   npx tsx scripts/audio/upload-blob.mts --dry-run    show exactly what WOULD be uploaded
//   npx tsx scripts/audio/upload-blob.mts              upload, then write the manifest
//   npx tsx scripts/audio/upload-blob.mts --db         additionally fill KoreanItem columns
//
// Needs BLOB_READ_WRITE_TOKEN in the environment. It is never created, never printed and never
// written to a file by this script — if it is absent the script stops and says so. Same for
// DATABASE_URL under --db. Providing them is the founder's step, not this script's.
//
// Ported from almi-pte's putAudio (src/lib/storage/blob.ts): put(key, body, {access: "public",
// contentType}). Two deliberate differences, both because these are FIXED CONTENT rather than
// per-attempt recordings:
//
//   * addRandomSuffix is OFF. PTE sets it because each generation is a new artefact. Here the
//     key must be reproducible: re-running the upload has to overwrite the same object rather
//     than litter the store with orphans nobody can match back to an item. That means
//     `allowOverwrite` on repeat runs, which is stated rather than discovered.
//   * The key is the STABLE ITEM ID, not the database row id. KoreanItem.id is a cuid minted
//     at seed time — it changes if the table is ever re-seeded, which would break every URL.
//     stableItemId hashes {track, section, title}, the table's own unique key, so the same item
//     yields the same key on any machine and without a database connection.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const MP3DIR = process.env.AUDIO_OUT ?? join(ROOT, ".audio-mp3");
const MANIFEST = join(ROOT, "src", "data", "audio-manifest.json");
const REPORT = join(HERE, "readings-report.json");

const DRY = process.argv.includes("--dry-run");
const WITH_DB = process.argv.includes("--db");

type Item = { track: string; section: string; title: string };
type Clip = { url: string; durationSec: number; voice: string; bytes: number };

/** Must match src/lib/items.ts stableItemId exactly — same tuple, same slice. */
function stableItemId(it: Item): string {
  return createHash("sha256")
    .update(JSON.stringify({ track: it.track, section: it.section, title: it.title }))
    .digest("hex")
    .slice(0, 16);
}

function die(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

const bank: Item[] = JSON.parse(readFileSync(join(ROOT, "src", "data", "items-batch1.json"), "utf8"));
const listening = bank.filter((i) => i.section === "LISTENING");

if (!existsSync(MP3DIR)) die(`no rendered audio at ${MP3DIR} — run scripts/audio/synth-listening.py --all first`);

// Durations come from the render report rather than being re-measured: the renderer already
// knows them exactly, and a second measurement here would be a second source of truth.
const durations = new Map<string, number>();
const voices = new Map<string, string>();
if (existsSync(REPORT)) {
  const r = JSON.parse(readFileSync(REPORT, "utf8"));
  for (const c of r.clips ?? []) {
    durations.set(c.title, Math.round(c.seconds));
    voices.set(c.title, `melotts-kr${(c.genders ?? []).includes("male") ? "+shift-7st" : ""}`);
  }
}

const planned: { title: string; key: string; file: string; bytes: number; durationSec: number; voice: string }[] = [];
const missing: string[] = [];
for (const it of listening) {
  const file = join(MP3DIR, `${it.title}.mp3`);
  if (!existsSync(file)) {
    missing.push(it.title);
    continue;
  }
  const bytes = readFileSync(file).byteLength;
  planned.push({
    title: it.title,
    key: `korean-listening/${stableItemId(it)}.mp3`,
    file,
    bytes,
    durationSec: durations.get(it.title) ?? 0,
    voice: voices.get(it.title) ?? "melotts-kr",
  });
}

const strays = readdirSync(MP3DIR)
  .filter((f) => f.endsWith(".mp3"))
  .map((f) => f.replace(/\.mp3$/, ""))
  .filter((t) => !listening.some((i) => i.title === t));

const totalBytes = planned.reduce((a, p) => a + p.bytes, 0);
console.log(`\n=== blob upload plan ===`);
console.log(`source  : ${MP3DIR}`);
console.log(`clips   : ${planned.length}/${listening.length} listening item(s) have a rendered MP3`);
console.log(`payload : ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
if (missing.length) console.log(`MISSING : ${missing.length} — ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? " …" : ""}`);
if (strays.length) console.log(`STRAY   : ${strays.length} MP3(s) in the folder that match no listening item — ${strays.join(", ")}`);

// Refusing a partial upload is the point. A half-filled manifest passes a naive count and
// leaves specific items silent, which is exactly the failure the coverage gate exists to stop.
if (missing.length) die(`${missing.length} clip(s) not rendered — re-run the renderer before uploading`);

if (DRY) {
  for (const p of planned.slice(0, 5)) console.log(`  ${p.key}  <- ${p.title}  (${(p.bytes / 1024).toFixed(0)} KB, ${p.durationSec}s)`);
  if (planned.length > 5) console.log(`  … and ${planned.length - 5} more`);
  console.log(`\n(dry run — nothing uploaded, manifest untouched)\n`);
  process.exit(0);
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  die(
    "BLOB_READ_WRITE_TOKEN is not set.\n" +
      "  Create the Blob store in the Vercel dashboard, then run this with the token in the\n" +
      "  environment. This script will not create, guess or persist a credential.",
  );
}

const { put } = await import("@vercel/blob");

const clips: Record<string, Clip> = {};
let done = 0;
for (const p of planned) {
  const body = readFileSync(p.file);
  const res = await put(p.key, body, {
    access: "public",
    token,
    contentType: "audio/mpeg",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  clips[p.title] = { url: res.url, durationSec: p.durationSec, voice: p.voice, bytes: p.bytes };
  done++;
  console.log(`  [${String(done).padStart(2)}/${planned.length}] ${p.title}  ->  ${res.url}`);
}

const manifest = {
  engine: "MeloTTS Korean (MIT) — rendered offline, male turns shifted -7 semitones",
  bitrate: "48k mono",
  clips,
};
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`\n✓ uploaded ${done} clip(s) · manifest written to src/data/audio-manifest.json`);
console.log(`  run  npx tsx scripts/audio-coverage-gate.ts  to confirm 36/36, then commit the manifest.`);

if (WITH_DB) {
  if (!process.env.DATABASE_URL) die("--db given but DATABASE_URL is not set");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  let rows = 0;
  for (const it of listening) {
    const c = clips[it.title];
    if (!c) continue;
    const r = await prisma.koreanItem.updateMany({
      where: { track: it.track as never, section: it.section as never, title: it.title },
      data: { audioUrl: c.url, durationSec: c.durationSec, voice: c.voice },
    });
    rows += r.count;
  }
  await prisma.$disconnect();
  console.log(`✓ KoreanItem rows updated: ${rows}/${listening.length}`);
  console.log(`  (requires migration 4_listening_audio to have been applied)`);
}
