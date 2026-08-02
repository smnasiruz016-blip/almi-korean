import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { issueEmailVerificationToken, verifyUrlFor } from "@/lib/verify";
import { sendEmailVerification } from "@/lib/email";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { logRefusal, logError } from "@/lib/observability";

// 5 accounts per hour per source. A real person creates one. This bounds both the account
// table and the verification emails signup sends — every unthrottled signup was also a free
// send against the Resend quota, addressed to whatever the caller typed.
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  const rl = rateLimit(`signup:${clientKey(req)}`, LIMIT, WINDOW_MS);
  if (!rl.ok) {
    logRefusal({ route: "/api/auth/signup", status: 429, reason: "rate-limited", req });
    return tooManyRequests("Too many accounts created from here. Please try again later.", rl.retryAfterSec);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid email or password (min 8 chars)." }, { status: 400 });
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), passwordHash: await hashPassword(password), name: name ?? null },
  });
  await createSession(user.id);

  // Best-effort verification email — never block signup if email send fails
  // (e.g. RESEND_API_KEY not yet set). The user can resend from their account.
  try {
    const token = await issueEmailVerificationToken(user.id);
    await sendEmailVerification({ to: user.email, verifyUrl: verifyUrlFor(token) });
  } catch (e) {
    logError({ route: "/api/auth/signup", op: "send-verification-email", error: e, req, userId: user.id });
  }

  return NextResponse.json({ ok: true });
}
