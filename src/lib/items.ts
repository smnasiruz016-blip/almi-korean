// AlmiKorean — app-side item loader (bundled Batch-1 bank). Used for Wave-1 practice before
// the Neon DB is provisioned; the same bank seeds the DB later (Phase-2 seed pipeline).
// Items are bucketed by {track × section}, never by output level (levels are computed by the engine).
import { createHash } from "node:crypto";
import bank from "@/data/items-batch1.json";
import type { TopikTrack, TopikSkill } from "@prisma/client";

export type Option = { id: string; text: string };
export type Question = { id: string; stem: string; options: Option[]; answer: string };
export type WritingSpec = { taskNumber: number; prompt: string; charMin?: number; charMax?: number; guidance?: string };
export type Speaker = { role: string; voice: string };
export type ItemPayload = {
  passages?: { id: string; body: string }[]; //  READING
  audioScript?: string; //                        LISTENING
  speakers?: Speaker[]; //                         LISTENING
  questions?: Question[]; //                       LISTENING / READING (objective)
  writing?: WritingSpec; //                        WRITING (Tasks 51–54)
};
export type BankItem = {
  track: TopikTrack;
  section: TopikSkill;
  taskType: string;
  difficulty: string;
  title: string;
  topicTag?: string;
  guidanceNote?: string;
  payload: ItemPayload;
};

export const BANK = bank as unknown as BankItem[];

export function itemsFor(track: TopikTrack, section: TopikSkill): BankItem[] {
  return BANK.filter((i) => i.track === track && i.section === section);
}

// ── SERVER-SIDE ITEM IDENTITY ───────────────────────────────────────────────
// Marking is server-authoritative: /api/ko/submit re-loads each item by id and marks it
// against the SERVER-held key, so the key never ships in the served payload and nothing
// the browser claims about correctness is trusted. Before this existed the bank went to
// the client with `answer` intact and PracticeRunner scored it in the page.
//
// ── WHY THE HASH IS EXACTLY {track, section, title} ──
// That tuple is the DATABASE'S OWN unique key — KoreanItem @@unique([track, section, title])
// — and the seeder's dedup key. Hashing precisely it means one string identifies the item
// in the bundle AND resolves the KoreanItem row in Neon, so an attempt persists against a
// real foreign key instead of falling into a catch.
//
// It is a clean bijection here without inventing anything: all 92 titles are machine slugs
// matching ^(TI|TII)-(L|R|W)-NN-slug$ and are unique, and build-batch1.mjs already fails the
// build on a duplicate title. Do NOT widen this to include the payload — that would DESYNC
// the id from the row it names (edit a question and the id moves while the row stays). The
// trade, stated: editing a title changes the id AND makes the seed create a new row, which
// is the two moving together rather than apart.

/** Stable, content-derived id — the handle the client posts back. */
export function stableItemId(it: Pick<BankItem, "track" | "section" | "title">): string {
  return createHash("sha256")
    .update(JSON.stringify({ track: it.track, section: it.section, title: it.title }))
    .digest("hex")
    .slice(0, 16);
}

/** Re-load the full item — INCLUDING its answer key — by its stable id, server-side. */
export function getItemByStableId(id: string): BankItem | undefined {
  return BANK.find((it) => stableItemId(it) === id);
}

/** The collision check as a PURE function over any item list, so the gate can be shown RED
 *  against a synthetic duplicate without ever editing the authored bank. */
export function findIdCollisions(items: readonly BankItem[]): string[] {
  const seen = new Map<string, string>();
  const out: string[] = [];
  for (const it of items) {
    const id = stableItemId(it);
    const key = `${it.track}|${it.section}|${it.title}`;
    const prior = seen.get(id);
    if (prior) {
      out.push(`"${key}" and "${prior}" both hash to ${id} — the seed would merge them into one row, and grading would key against the wrong item`);
      continue;
    }
    seen.set(id, key);
  }
  return out;
}

/** Build-time guard: no two bank items may share a stable id. */
export function assertNoIdCollisions(): void {
  const collisions = findIdCollisions(BANK);
  if (collisions.length > 0) {
    throw new Error(`stableItemId collision:\n  ${collisions.join("\n  ")}`);
  }
}

// ── WHAT THE BROWSER IS ALLOWED TO SEE ──────────────────────────────────────
// RunnerQuestion is Question WITHOUT `answer`. That omission is the whole point, and the
// TYPE enforces it rather than a habit: a page that tries to pass the bank straight through
// no longer compiles.
//
// The correct option is disclosed only by the reply to a SCORED submission, and only for a
// whole section at once, so there is no per-item reveal to harvest mid-attempt.
//
// `title` IS carried: lib/topik/shuffle.ts seeds the render-order permutation from
// `title:q.id`, and that shuffle stays on the client. It is not a key — it is the item's
// name, and it is already in the URL-free public surface of the product.
export type RunnerOption = { id: string; text: string };
export type RunnerQuestion = { id: string; stem: string; options: RunnerOption[] };
export type RunnerItem = {
  /** Stable server id (hash of track|section|title) — posted back so the server re-loads
   *  the item and marks against its OWN key. Replaced the answer key that used to ship. */
  id: string;
  track: TopikTrack;
  section: TopikSkill;
  taskType: string;
  difficulty: string;
  title: string;
  topicTag?: string;
  guidanceNote?: string;
  payload: {
    passages?: { id: string; body: string }[];
    /** LISTENING: the script the browser's Web Speech voice reads, and the transcript shown
     *  when the device has no Korean voice. Content, not a key. */
    audioScript?: string;
    speakers?: Speaker[];
    /** WRITING (Tasks 51–54) has no key to strip — it is not auto-marked at all. */
    writing?: WritingSpec;
    questions: RunnerQuestion[];
  };
};

/** Strip an authored item down to what a learner may receive. */
export function toRunnerItem(it: BankItem): RunnerItem {
  return {
    id: stableItemId(it),
    track: it.track,
    section: it.section,
    taskType: it.taskType,
    difficulty: it.difficulty,
    title: it.title,
    topicTag: it.topicTag,
    guidanceNote: it.guidanceNote,
    payload: {
      passages: it.payload.passages,
      audioScript: it.payload.audioScript,
      speakers: it.payload.speakers,
      writing: it.payload.writing,
      // `answer` is deliberately not carried over. Do not spread `q` here.
      questions: (it.payload.questions ?? []).map((q) => ({
        id: q.id,
        stem: q.stem,
        options: q.options.map((o) => ({ id: o.id, text: o.text })),
      })),
    },
  };
}

/** Counts per section within a track (used by /practice pickers + /api/status). */
export function trackCounts(track: TopikTrack): Record<TopikSkill, number> {
  return {
    LISTENING: itemsFor(track, "LISTENING").length,
    READING: itemsFor(track, "READING").length,
    WRITING: itemsFor(track, "WRITING").length,
  };
}
