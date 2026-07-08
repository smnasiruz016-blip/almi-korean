import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { issueEmailVerificationToken, verifyUrlFor } from "@/lib/verify";
import { sendEmailVerification } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
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
    console.error("[signup] verification email failed:", e);
  }

  return NextResponse.json({ ok: true });
}
