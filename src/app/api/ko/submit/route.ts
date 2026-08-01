// PRACTICE submit endpoint — the server side that did not exist.
//
// Marks a whole section against the SERVER-held answer keys, re-loaded by the posted item
// ids. The client supplies only which option it chose; it never supplies a key, a score, or
// the track and section it wants to be measured on. See lib/topik/grade-attempt.ts for what
// this replaced and why.
//
// The correct options come back in this reply, AFTER the section has been marked — which is
// also the only place they are ever disclosed. Because a section is submitted in one call,
// there is no per-item reveal for a client to harvest before committing its answers.
//
// ── WHY AUTH-ONLY, NOT PAID-ONLY ──
// AlmiKorean's access model is a SKILL split (lib/access.ts): the objective, auto-marked
// sections — Listening and Reading — are free to any signed-in user, and only TOPIK II
// Writing and the sequenced mock require hasPaidAccess(). Writing is refused upstream because
// it has no key. So the only thing this route can mark is already free to a signed-in learner,
// and adding a 402 here would contradict the product's own stated free tier rather than
// protect anything. This is a deliberate divergence from the AlmiJapanese route it ports,
// where every practice skill is paid.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { gradeAttempt, type AttemptBody } from "@/lib/topik/grade-attempt";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let body: AttemptBody;
  try {
    body = (await req.json()) as AttemptBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const graded = await gradeAttempt(body, user);
  if (!graded.ok) {
    return NextResponse.json({ ok: false, error: graded.error }, { status: graded.status });
  }

  return NextResponse.json({
    ok: true,
    correct: graded.correct,
    total: graded.total,
    percent: graded.percent,
    track: graded.track,
    section: graded.section,
    marks: graded.marks,
  });
}
