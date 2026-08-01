// Server-authoritative marking for one practice section.
//
// The client posts only item ids and the option it chose per question. Every item — and its
// answer key — is re-loaded server-side by id, so a client-supplied key is never trusted and
// the key never had to ship in the served payload.
//
// ── WHAT THIS REPLACED ──
// There was no server in the loop at all. src/components/PracticeRunner.tsx marked with
// `answers[f.key] === f.q.answer` in the browser, against a key that arrived with the
// question, and nothing was posted or persisted. The audit could not even call it broken —
// it reported ERROR, "cannot be proved either way", because a verdict the client computes is
// a verdict the client can choose.
//
// A whole section is submitted at once, matching the runner's single Submit. That is also why
// there is no per-item reveal to harvest: the correct options come back only after every
// answer in the section is committed.
//
// ── SHUFFLE-AGNOSTIC BY CONSTRUCTION ──
// lib/topik/shuffle.ts permutes option ORDER at render, on the client. Nothing here knows or
// cares about that: marking compares option IDS, and an id travels with its own option text
// through any permutation. The two fixes are independent — one ends position-gaming, this one
// ends client-directed grading — and neither can quietly undo the other.

import { prisma } from "@/lib/prisma";
import { getItemByStableId, type BankItem, type Question } from "@/lib/items";
import type { TopikTrack, TopikSkill } from "@prisma/client";

type AttemptUser = { id: string };

/** Everything a client is allowed to say. Note what is ABSENT: no answer, no score, no
 *  correct/total, no track or section. Those are facts about the ITEMS, and the server owns
 *  them. Widening this type is how the original defect would come back — and because the
 *  route types its body as exactly this, adding `answer` back turns tsc red at the call site. */
export interface AttemptBody {
  items?: { itemId?: string; answers?: Record<string, string> }[];
}

export interface QuestionMark {
  itemId: string;
  questionId: string;
  chosenOptionId: string | null;
  correct: boolean;
  /** The right option — disclosed here, after the section has been marked. */
  correctOptionId: string;
}

export type GradeOutcome =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      correct: number;
      total: number;
      /** 0–100 raw percent for this section. TOPIK sections are point-counted, so this is
       *  the section score the engine takes — no IRT, no scaling, no invented number. */
      percent: number;
      track: TopikTrack;
      section: TopikSkill;
      marks: QuestionMark[];
    };

/** Mark ONE question against ITS OWN key. The question is the first argument on purpose:
 *  this is the single place the key is consumed, so "where does that question come from" is
 *  the whole of the server-authoritative question, and it is answerable by reading one line.
 *  It comes from getItemByStableId — never from anything in the request. */
export function markQuestion(question: Question, chosenOptionId: string | null): { correct: boolean; correctOptionId: string } {
  return {
    correct: chosenOptionId !== null && chosenOptionId === question.answer,
    correctOptionId: question.answer,
  };
}

export async function gradeAttempt(body: AttemptBody, user: AttemptUser): Promise<GradeOutcome> {
  const posted = Array.isArray(body.items) ? body.items : null;
  if (!posted || posted.length === 0) return { ok: false, status: 400, error: "Missing items" };

  const loaded: { id: string; item: BankItem; answers: Record<string, string> }[] = [];
  const marks: QuestionMark[] = [];
  for (const p of posted) {
    const id = typeof p?.itemId === "string" ? p.itemId : "";
    if (!id) return { ok: false, status: 400, error: "Missing itemId" };
    // An id that resolves to nothing FAILS LOUDLY. Returning a 0 here would be the same
    // defect in a quieter coat: the caller could not tell a wrong answer from an unknown
    // item, and a typo'd id would read as a legitimately failed section.
    const item = getItemByStableId(id);
    if (!item) return { ok: false, status: 404, error: `Unknown item: ${id}` };
    const answers = p.answers && typeof p.answers === "object" ? p.answers : {};
    loaded.push({ id, item, answers });
    // Marked here, beside the load, so the key never travels further than the item it belongs
    // to. `q` is an element of the server-loaded item, not of the request.
    marks.push(
      ...(item.payload.questions ?? []).map((q) => {
        const chosen = typeof answers[q.id] === "string" ? answers[q.id] : null;
        return { itemId: id, questionId: q.id, chosenOptionId: chosen, ...markQuestion(q, chosen) };
      }),
    );
  }

  // Track and section come from the ITEMS, not the body. A section is one track and one
  // section by construction; a mixed post is a malformed one and is refused rather than
  // scored against whichever the client would prefer to be measured on.
  const tracks = new Set(loaded.map((l) => l.item.track));
  const sections = new Set(loaded.map((l) => l.item.section));
  if (tracks.size !== 1 || sections.size !== 1) {
    return { ok: false, status: 400, error: "Items span more than one track or section" };
  }
  const track = [...tracks][0];
  const section = [...sections][0];

  // TOPIK II Writing (Tasks 51–54) is rater-graded prose with no key to compare against.
  // Refusing it is the honest answer: silently returning 0/0 would let a Writing post be
  // presented as a marked section that scored nothing.
  if (section === "WRITING") {
    return { ok: false, status: 400, error: "Writing is not auto-marked — Tasks 51–54 have no answer key" };
  }
  if (marks.length === 0) return { ok: false, status: 400, error: "No markable questions in these items" };

  const correct = marks.filter((m) => m.correct).length;
  const total = marks.length;
  const percent = Math.round((correct / total) * 100);

  // Persistence, per item. KoreanItem is seeded (92 rows live) and KoreanAttempt.itemId is a
  // real FK to it, resolved by the same {track, section, title} tuple the stable id hashes.
  // A failure here must never cost the learner their marks, so it is caught.
  try {
    for (const { item, answers } of loaded) {
      const row = await prisma.koreanItem.findUnique({
        where: { track_section_title: { track: item.track, section: item.section, title: item.title } },
        select: { id: true },
      });
      if (!row) continue;
      await prisma.koreanAttempt.create({
        data: {
          userId: user.id,
          itemId: row.id,
          track: item.track,
          section: item.section,
          status: "SUBMITTED",
          response: { answers } as object,
          result: { correct, total, percent, section } as object,
        },
      });
    }
  } catch {
    // attempts are best-effort; a persistence fault never changes what the learner is told
  }

  return { ok: true, correct, total, percent, track, section, marks };
}
