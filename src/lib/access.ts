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
// gets shown/charged before it is real; free practice stays open.
export function isBillingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

const ACTIVE_STATUSES = new Set(["trialing", "active"]);

// Network standard (confirmed by the founder): 7-day free trial from signup, then $12/month.
// The trial is APP-SIDE and derived from the account's createdAt — no DB field, no migration, and
// it works even before Stripe is wired (fail-closed billing must not block the trial). This mirrors
// the AlmiItalian practice gate; it is an ADDITIVE divergence from the older AlmiPrep/AlmiSpanish
// gate, where the only "trial" is Stripe's own trialing status (card required).
export const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function trialEndsAt(user: Pick<User, "createdAt">): Date {
  return new Date(user.createdAt.getTime() + TRIAL_DAYS * DAY_MS);
}
export function isInTrial(user: Pick<User, "createdAt">): boolean {
  return trialEndsAt(user).getTime() > Date.now();
}
/** Whole days left on the free trial (ceil), 0 once it has ended. */
export function trialDaysLeft(user: Pick<User, "createdAt">): number {
  return Math.max(0, Math.ceil((trialEndsAt(user).getTime() - Date.now()) / DAY_MS));
}

function hasActiveSubscription(user: Pick<User, "subscriptionStatus" | "subscriptionCurrentPeriodEnd">): boolean {
  if (!isBillingEnabled()) return false; //                   no real subscriptions possible yet
  if (user.subscriptionStatus && ACTIVE_STATUSES.has(user.subscriptionStatus)) {
    // trialing/active; if a period end is recorded, honour it.
    return !user.subscriptionCurrentPeriodEnd || user.subscriptionCurrentPeriodEnd > new Date();
  }
  return false;
}

type PracticeUser = Pick<User, "email" | "createdAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd" | "compProUntil">;

// The single chokepoint for the practice runner. Order: owner → comp → app-side trial → paid sub.
// A signed-in user practises free for 7 days from signup; after that an active subscription is
// required (and if Stripe isn't wired yet, the subscribe flow shows its honest unavailable state).
export function hasPracticeAccess(user: PracticeUser | null): boolean {
  if (!user) return false;
  if (isOwner(user.email)) return true; //                    owner bypass
  if (user.compProUntil && user.compProUntil > new Date()) return true; // admin-granted comp
  if (isInTrial(user)) return true; //                        7-day app-side trial (Stripe-independent)
  return hasActiveSubscription(user);
}

// The chokepoint for premium (e.g. the full timed mock, once built) — paid-only, no trial grant.
export function hasPaidAccess(user: Pick<User, "email" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd" | "compProUntil"> | null): boolean {
  if (!user) return false;
  if (isOwner(user.email)) return true;
  if (user.compProUntil && user.compProUntil > new Date()) return true;
  return hasActiveSubscription(user);
}
