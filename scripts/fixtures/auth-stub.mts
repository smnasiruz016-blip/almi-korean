// Stub for @/lib/auth, used ONLY by scripts/grade-integrity-proof.mts.
// The real getCurrentUser() reads cookies, which throws outside a request scope. The proof is
// not testing session handling — it is testing what the route does with a caller's BODY.
// The unauthenticated case is proved separately, by swapping this to return null.
export async function getCurrentUser() {
  if (process.env.PROOF_UNAUTHENTICATED === "1") return null;
  return { id: "proof-user", email: "proof@example.test", role: "USER", emailVerifiedAt: null };
}
