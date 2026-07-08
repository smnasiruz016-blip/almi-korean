import type { User } from "@prisma/client";

// Access tiers (canonical AlmiWorld pattern).
// OWNER_EMAILS → unlimited usage / premium bypass on this product (testing, demos, daily use).
// ADMIN_EMAILS → the /admin panel. A user can be in both; the founder is.
function inList(envVar: string | undefined, email: string | null | undefined): boolean {
  if (!email || !envVar) return false;
  return envVar.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}

export const isOwner = (email: string | null | undefined) => inList(process.env.OWNER_EMAILS, email);
export const isAdmin = (email: string | null | undefined) => inList(process.env.ADMIN_EMAILS, email);

// Billing is OFF until the founder sets the price id + Stripe key. Fail-closed = no paywall
// gets shown/charged before it is real.
export function isBillingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

const ACTIVE_STATUSES = new Set(["trialing", "active"]);

function hasActiveSubscription(
  user: Pick<User, "subscriptionStatus" | "subscriptionCurrentPeriodEnd">,
): boolean {
  if (!isBillingEnabled()) return false; //                   no real subscriptions possible yet
  if (user.subscriptionStatus && ACTIVE_STATUSES.has(user.subscriptionStatus)) {
    // trialing/active; if a period end is recorded, honour it.
    return !user.subscriptionCurrentPeriodEnd || user.subscriptionCurrentPeriodEnd > new Date();
  }
  return false;
}

// NETWORK STANDARD (Goethe/CELPIP), confirmed by the founder 2026-07-08.
// The 7-day free trial is STRIPE's own `trialing` status — card saved at checkout, not
// charged — NOT an app-side timer. (This product previously ran an app-side trial derived
// from createdAt that opened *everything* for 7 days with no card; that divergence is removed.)
//
// Free vs paid is a SKILL split, mirroring Goethe's scoringMode gate:
//   • Objective, auto-marked skills (Listening/Reading) → free to any signed-in user.
//   • The AI-feedback skill (TOPIK II Writing) + the sequenced mock → require hasPaidAccess().
//
// Paid access requires an active subscription AND a verified email (Goethe parity) — owner
// and comp bypass both. `needsEmailVerification` distinguishes "paid but unverified" so the UI
// can say "verify your email" instead of "subscribe".
type PaidUser = Pick<
  User,
  "email" | "emailVerifiedAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd" | "compProUntil"
>;

export function hasPaidAccess(user: PaidUser | null): boolean {
  if (!user) return false;
  if (isOwner(user.email)) return true; //                    owner bypass
  if (user.compProUntil && user.compProUntil > new Date()) return true; // admin-granted comp
  return hasActiveSubscription(user) && user.emailVerifiedAt !== null;
}

// True when the only thing standing between the user and paid access is email
// verification (they have an active/trialing sub but haven't verified yet).
export function needsEmailVerification(user: PaidUser | null): boolean {
  if (!user) return false;
  if (isOwner(user.email)) return false;
  if (user.compProUntil && user.compProUntil > new Date()) return false;
  return hasActiveSubscription(user) && user.emailVerifiedAt === null;
}
