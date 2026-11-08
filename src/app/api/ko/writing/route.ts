// TOPIK II Writing feedback endpoint (Tasks 51–54).
//
// ── THE PAID CHECK (RR-397) ──
// Paid learners as before. A free account (the 48 hours from sign-up, no card) gets ONE AI-scored
// Writing, and only while today's free-AI budget lasts (lib/free-access.ts aiGate). This gate is
// the only thing standing between an account with no subscription and a model bill, so it is
// bounded three ways: the 48 hours, one scoring per account, and the daily budget.
//
// ── WHAT THE CLIENT IS ALLOWED TO SEND ──
// An item id and the learner's own Korean. Not the prompt, not the task number, not the
// character band, and certainly not a score. The prompt and band are re-loaded server-side
// from the bank by stableItemId — the same handle and the same discipline as the objective
// route — so a client cannot swap in an easier prompt or claim a task has no length band.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiGate } from "@/lib/free-access";
import { getItemByStableId } from "@/lib/items";
import { isWritingFeedbackEnabled } from "@/lib/ai/anthropic-client";
import { evaluateWriting } from "@/lib/topik/writing-grader";
import { logRefusal, logError } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** The model call is the slow part; the default 300s ceiling applies, this is the honest budget. */
export const maxDuration = 120;

/** Bounds one request. Task 54 tops out at 700자; 8000 leaves generous room for an
 *  over-length draft while refusing a pasted book as an input-token bill. */
const MAX_CHARS = 8000;
/** Bounds one user. 20 graded essays in an hour is far past real study and well short of
 *  anything that costs. Counted in the DB, not in memory, so it survives a cold start and
 *  holds across instances — an in-process counter would reset on every new lambda. */
const HOURLY_LIMIT = 20;

export interface WritingBody {
  itemId?: string;
  text?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    logRefusal({ route: "/api/ko/writing", status: 401, reason: "no-session", req });
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
  // RR-397: paid users as before (hasPaidAccess() is asked first inside aiGate, unchanged); a free account (48 hours, no card)
  // gets ONE AI-scored Writing, within today's free-AI budget. "Used" = a Writing attempt this account already received
  // feedback on (section WRITING, status SCORED), not a click.
  const gate = await aiGate(user, "WRITING", () =>
    prisma.koreanAttempt.count({ where: { userId: user.id, section: "WRITING", status: "SCORED" } }),
  );
  if (!gate.ok) {
    logRefusal({ route: "/api/ko/writing", status: 402, reason: `not-paid:${gate.body.reason}`, req, userId: user.id });
    return NextResponse.json(gate.body, { status: gate.status });
  }
  // RR-399 A3: from here on a free account holds its reserved free scoring. Every answer that is NOT a scoring gives it back
  // (gate.release(); a no-op for paid users), so a refused or failed request never uses up the learner's one free Writing.
  const refuse = async (body: unknown, init: { status: number }): Promise<NextResponse> => {
    await gate.release();
    return NextResponse.json(body, init);
  };
  // A free scoring also needs a verified email, as paid access already does here (and as AlmiOET's taste does): checked after
  // the 402 so that stays the first answer, and before the model call so no unverified request costs money.
  if (gate.free && user.emailVerifiedAt === null) {
    logRefusal({ route: "/api/ko/writing", status: 403, reason: "unverified", req, userId: user.id });
    return refuse(
      { ok: false, error: "Verify your email address before using AI feedback.", verifyUrl: "/account" },
      { status: 403 },
    );
  }
  // No key configured → say so. Never a fabricated band: a made-up "estimate" is worse than
  // no estimate, because the learner cannot tell the difference.
  if (!isWritingFeedbackEnabled()) {
    return refuse(
      { ok: false, error: "Writing feedback is temporarily unavailable." },
      { status: 503 },
    );
  }

  let body: WritingBody;
  try {
    body = (await req.json()) as WritingBody;
  } catch {
    return refuse({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!itemId) return refuse({ ok: false, error: "Missing itemId" }, { status: 400 });
  if (!text) return refuse({ ok: false, error: "Write something first." }, { status: 400 });
  if (Array.from(text).length > MAX_CHARS) {
    logRefusal({ route: "/api/ko/writing", status: 413, reason: "over-max-chars", req, userId: user.id });
    return refuse({ ok: false, error: "That response is too long to assess." }, { status: 413 });
  }

  // An unknown id fails loudly rather than being graded against nothing — same rule as
  // /api/ko/submit, for the same reason.
  const item = getItemByStableId(itemId);
  if (!item) return refuse({ ok: false, error: `Unknown item: ${itemId}` }, { status: 404 });
  if (item.section !== "WRITING" || !item.payload.writing) {
    return refuse(
      { ok: false, error: "That item is not a Writing task." },
      { status: 400 },
    );
  }

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.koreanAttempt.count({
    where: { userId: user.id, section: "WRITING", status: "SCORED", createdAt: { gte: since } },
  });
  if (recent >= HOURLY_LIMIT) {
    logRefusal({ route: "/api/ko/writing", status: 429, reason: "hourly-limit", req, userId: user.id });
    return refuse(
      { ok: false, error: "You've submitted a lot of Writing tasks in the past hour. Try again shortly." },
      { status: 429 },
    );
  }

  let score;
  try {
    score = await evaluateWriting({
      spec: item.payload.writing,
      guidanceNote: item.guidanceNote,
      text,
      userId: user.id, // RR-399 A6: the AICostLedger row names the account
    });
  } catch (e) {
    // The 400 that took this feature down on its first real call surfaced through exactly
    // this line. Structured now, so the next one is filterable rather than buried.
    logError({ route: "/api/ko/writing", op: "grade-writing", error: e, req, userId: user.id });
    return refuse(
      { ok: false, error: "We couldn't assess that just now. Please try again." },
      { status: 502 },
    );
  }

  // Persist. Best-effort, exactly as in gradeAttempt: a write fault must never cost the
  // learner feedback they already waited for and paid for. The FK is resolved by the same
  // {track, section, title} tuple stableItemId hashes.
  try {
    const row = await prisma.koreanItem.findFirst({
      where: { track: item.track, section: item.section, title: item.title },
      select: { id: true },
    });
    if (row) {
      await prisma.koreanAttempt.create({
        data: {
          userId: user.id,
          itemId: row.id,
          track: item.track,
          section: item.section,
          status: "SCORED",
          response: { text } as object,
          result: {
            taskNumber: item.payload.writing.taskNumber,
            estimate: score.estimate,
            chars: score.chars,
            band: score.band,
            feedback: score.feedback,
            model: score.telemetry.model,
            // Named so nothing downstream can mistake it for a TOPIK score.
            kind: "practice-estimate",
          } as object,
        },
      });
    }
  } catch (e) {
    logError({ route: "/api/ko/writing", op: "persist-attempt", error: e, req, userId: user.id });
  }

  return NextResponse.json({
    ok: true,
    taskNumber: item.payload.writing.taskNumber,
    estimate: score.estimate,
    chars: score.chars,
    band: score.band,
    feedback: score.feedback,
  });
}
