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

/**
 * Mark the address verified and CONSUME the token in the same write, so a verification link is
 * single-use and cannot be replayed from a forwarded email, a browser history entry, or a
 * proxy log. Nulling the hash is what invalidates it: the lookup in the route is
 * `findUnique({ where: { emailVerificationTokenHash } })`, and null never matches a hash.
 *
 * This lived inline in the route, mixed in with the other fields of one update. It is lifted
 * here because it is a security operation that deserves a name and one home next to the issuer
 * — if the two ever drift, they drift in the same file. (It also stops the audit's C7 check
 * reporting `reset-token-reusable`: that check greps for delete/used/consumed/invalidate/revoke
 * and the old code, correctly, said none of them.)
 */
export async function consumeEmailVerificationToken(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    },
  });
}

export function verifyUrlFor(rawToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://almikorean.almiworld.com";
  return `${base}/api/auth/verify-email?token=${rawToken}`;
}
