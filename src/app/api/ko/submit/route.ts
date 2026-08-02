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
// ── WHY THIS IS PAID, AND WHY IT SAID OTHERWISE ──
// This route was auth-only, on the stated grounds that lib/access.ts describes a SKILL split
// in which Listening and Reading are free to any signed-in user. That comment was reasoning
// from a doc-comment instead of from the code. Every practice surface — /practice,
// /practice/[track]/[section], /mock, /mock/[track] — ends a signed-in non-subscribed user
// with `redirect("/account")` before any section renders. So the free tier the comment
// protected does not exist: in the shipped product a signed-in learner without a subscription
// sees no practice of any kind.
//
// That made the paywall UI-only for objective marking. The page redirected, this route did
// not, and its reply DISCLOSES THE CORRECT OPTION for every question posted — so anyone who
// could name item ids could harvest the answer key without ever holding a subscription. The
// ids are sha256({track, section, title}) over machine-slug titles, which is an obstacle, not
// an access control.
//
// It now checks the same thing the pages check. If the free tier is ever actually opened, this
// is one of the places that has to change WITH it — see lib/access.ts.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/access";
import { gradeAttempt, type AttemptBody } from "@/lib/topik/grade-attempt";
import { logRefusal } from "@/lib/observability";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  // Both refusals are logged: this route's reply discloses correctOptionId for every question
  // posted, so a run of 401s or 402s against it is somebody probing for the answer key, and
  // that is exactly the pattern that used to leave no trace at all.
  if (!user) {
    logRefusal({ route: "/api/ko/submit", status: 401, reason: "no-session", req });
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
  if (!hasPaidAccess(user)) {
    logRefusal({ route: "/api/ko/submit", status: 402, reason: "not-paid", req, userId: user.id });
    return NextResponse.json(
      { ok: false, error: "Start your free trial to practise." },
      { status: 402 },
    );
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
