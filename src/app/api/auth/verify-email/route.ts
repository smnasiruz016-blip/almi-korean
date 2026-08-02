import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { consumeEmailVerificationToken } from "@/lib/verify";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_HEX_RE = /^[a-f0-9]{64}$/;

// A 256-bit token is not guessable, so this is not really brute-force defence — it is there so
// that an unauthenticated endpoint cannot be used to hammer the database with lookups. 30 per
// 15 minutes is far more than the handful of clicks a real link gets.
const LIMIT = 30;
const WINDOW_MS = 15 * 60 * 1000;

function getBaseUrl(req: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
}

// GET /api/auth/verify-email?token=... — the link target from the email. Always
// redirects to /verify-email with a status query param so the user sees a
// branded page rather than raw JSON.
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const base = getBaseUrl(req);

  // Over the limit is redirected like any other bad link rather than returned as a 429 JSON
  // body: this endpoint is reached by CLICKING an email, so the user must land on the branded
  // page either way. Raw JSON here would be a dead end for a person who did nothing wrong.
  if (!rateLimit(`verify-email:${clientKey(req)}`, LIMIT, WINDOW_MS).ok) {
    return NextResponse.redirect(`${base}/verify-email?status=throttled`);
  }

  if (!TOKEN_HEX_RE.test(token)) {
    return NextResponse.redirect(`${base}/verify-email?status=invalid`);
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findUnique({
    where: { emailVerificationTokenHash: tokenHash },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerificationExpiresAt: true,
      emailVerifiedAt: true,
    },
  });

  if (!user) {
    return NextResponse.redirect(`${base}/verify-email?status=invalid`);
  }

  // Already verified — treat the click as a no-op success.
  if (user.emailVerifiedAt) {
    return NextResponse.redirect(`${base}/verify-email?status=success`);
  }

  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    return NextResponse.redirect(`${base}/verify-email?status=expired`);
  }

  await consumeEmailVerificationToken(user.id);

  // Welcome email — sent once, only on the fresh-verification path (the
  // already-verified branch above returns early, so this never double-sends).
  // Fire-and-forget: a mail failure must not break the user's verification.
  try {
    await sendWelcomeEmail({ to: user.email, name: user.name });
  } catch (err) {
    console.error("[verify-email] welcome send failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.redirect(`${base}/verify-email?status=success`);
}
