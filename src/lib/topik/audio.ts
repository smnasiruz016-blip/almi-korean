// Where a listening clip lives, and how the build knows every item has one.
//
// ── WHY A COMMITTED MANIFEST AND NOT JUST THE DB COLUMN ────────────────────────
// KoreanItem carries voice/audioUrl/durationSec (Pattern B, ported from almi-pte), and the
// upload script fills them. But the coverage gate has to run inside `npm run build`, and this
// product's build is deliberately DB-free — Vercel builds it with `prisma generate && next
// build` and never opens a connection. A gate that needed DATABASE_URL would either be skipped
// on CI or make every build depend on Neon being reachable, and a gate that is skipped is not
// a gate.
//
// So the manifest is the build-time truth: committed, deterministic, readable with no network.
// The DB column is written by the same script for server-side parity — it is what a future
// signed-URL or per-user audio route would read. One writer, two readers, and the gate checks
// the one the build can actually see.
//
// The manifest holds PUBLIC Blob URLs. That is the same exposure almi-pte accepts: the clip is
// fixed content, identical for every learner, and it gives nothing away that the page does not
// already show. The SCRIPT is a different matter — it stays behind "Show transcript", because a
// visible transcript turns a listening item into a reading one.

import manifest from "@/data/audio-manifest.json";

export type AudioClip = {
  /** Public Vercel Blob URL, CDN-served. */
  url: string;
  durationSec: number;
  /** How the clip was rendered, not who is in it — MeloTTS has one Korean voice. */
  voice: string;
  bytes: number;
};

type Manifest = { engine: string; bitrate: string; clips: Record<string, AudioClip> };

const M = manifest as Manifest;

/** The clip for an item title, or null when it has not been rendered/uploaded yet. */
export function audioFor(title: string): AudioClip | null {
  return M.clips[title] ?? null;
}

export function clipCount(): number {
  return Object.keys(M.clips).length;
}

export function manifestMeta(): { engine: string; bitrate: string } {
  return { engine: M.engine, bitrate: M.bitrate };
}
