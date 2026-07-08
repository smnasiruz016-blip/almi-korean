import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;

// Issues a fresh email-verification token: stores its SHA-256 hash + a 24h
// expiry + a last-sent timestamp on the user, and returns the RAW token for the
// email link. The raw token is never stored (only its hash).
export async function issueEmailVerificationToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: new Date(Date.now() + VERIFY_TTL_MS),
      emailVerificationLastSentAt: new Date(),
    },
  });
  return rawToken;
}

export function verifyUrlFor(rawToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://almikorean.almiworld.com";
  return `${base}/api/auth/verify-email?token=${rawToken}`;
}
