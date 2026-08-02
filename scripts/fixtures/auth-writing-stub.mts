// Stub for @/lib/auth, used ONLY by scripts/writing-grader-proof.mts.
//
// The paid user is granted through `compProUntil`, not through a fake Stripe subscription,
// because hasPaidAccess() routes an active subscription through isBillingEnabled() — which
// reads STRIPE_SECRET_KEY. Faking a subscription would have meant putting fake Stripe keys in
// the environment to prove something about Writing. The comp path is a REAL production path
// (admin-granted access), so this exercises hasPaidAccess() for real rather than around it.

export async function getCurrentUser() {
  if (process.env.PROOF_UNAUTHENTICATED === "1") return null;
  const base = {
    id: "proof-user",
    email: "proof@example.test",
    role: "USER",
    emailVerifiedAt: null,
    subscriptionStatus: null,
    subscriptionCurrentPeriodEnd: null,
  };
  if (process.env.PROOF_UNPAID === "1") return { ...base, compProUntil: null };
  return { ...base, compProUntil: new Date(Date.now() + 86_400_000) };
}
