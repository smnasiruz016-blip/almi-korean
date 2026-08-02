import { getCurrentUser } from "@/lib/auth";
import { issueEmailVerificationToken, verifyUrlFor, RESEND_COOLDOWN_MS } from "@/lib/verify";
import { sendEmailVerification } from "@/lib/email";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (user.emailVerifiedAt) {
    return Response.json({ ok: true, alreadyVerified: true });
  }

  // Cooldown — prevent abuse via repeated resend clicks.
  if (
    user.emailVerificationLastSentAt &&
    user.emailVerificationLastSentAt.getTime() > Date.now() - RESEND_COOLDOWN_MS
  ) {
    return Response.json(
      { ok: false, error: "Please wait a moment before requesting another email." },
      { status: 429 },
    );
  }

  const rawToken = await issueEmailVerificationToken(user.id);

  try {
    await sendEmailVerification({ to: user.email, verifyUrl: verifyUrlFor(rawToken) });
  } catch (e) {
    logError({ route: "/api/auth/resend-verification", op: "send-verification-email", error: e, userId: user.id });
    return Response.json(
      { ok: false, error: "Email send failed. Try again in a moment." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
