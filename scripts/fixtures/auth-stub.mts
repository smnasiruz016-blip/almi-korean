// Stub for @/lib/auth, used ONLY by scripts/grade-integrity-proof.mts.
// The real getCurrentUser() reads cookies, which throws outside a request scope. The proof is
// not testing session handling — it is testing what the route does with a caller's BODY.
// The unauthenticated case is proved separately, by swapping this to return null.
//
// The paid user is granted through `compProUntil` — admin-granted access, a real production
// path — rather than a faked Stripe subscription, because hasPaidAccess() routes subscriptions
// through isBillingEnabled(), which reads STRIPE_SECRET_KEY. Faking one would have meant
// putting fake Stripe keys in the environment to prove something about marking.
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
