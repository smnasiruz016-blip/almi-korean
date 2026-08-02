import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { logRefusal } from "@/lib/observability";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

// 10 attempts per 15 minutes per source. Generous for a person who has forgotten which
// password they used; useless for a script working through a list. See lib/rate-limit.ts for
// what this counter does and does not guarantee.
const LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  // Counted BEFORE the body is parsed and before any bcrypt compare — the verify is the
  // expensive part, so a limiter placed after it would still let an attacker spend our CPU.
  const rl = rateLimit(`login:${clientKey(req)}`, LIMIT, WINDOW_MS);
  if (!rl.ok) {
    logRefusal({ route: "/api/auth/login", status: 429, reason: "rate-limited", req });
    return tooManyRequests("Too many sign-in attempts. Please wait a few minutes.", rl.retryAfterSec);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    // The failed attempt itself is the security event. The EMAIL is deliberately not logged —
    // it is the credential half that was guessed, it is personal data, and a log full of
    // attempted addresses is a list of our users for anyone who reads it. The client hash is
    // what makes a run countable, which is all this needs to do. It also does not record
    // whether the address existed, so the log cannot be mined to enumerate accounts.
    logRefusal({ route: "/api/auth/login", status: 401, reason: "bad-credentials", req });
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
