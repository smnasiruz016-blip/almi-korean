import type { User } from "@prisma/client";

// Access tiers (canonical AlmiWorld pattern).
// OWNER_EMAILS → unlimited usage / premium bypass on this product (testing, demos, daily use).
// ADMIN_EMAILS → the /admin panel. A user can be in both; the founder is.
function inList(envVar: string | undefined, email: string | null | undefined): boolean {
  if (!email || !envVar) return false;
  return envVar.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}

export const isOwner = (email: string | null | undefined) => inList(process.env.OWNER_EMAILS, email);
export const isAdmin = (email: string | null | undefined) =>
  email?.toLowerCase() === "almiworld@almiworld.com" || inList(process.env.ADMIN_EMAILS, email); // canonical founder always admin
// The /admin panel: reachable by ADMIN_EMAILS users and ALWAYS by the owner.
// The founder is in both lists per the canonical model; gating on this makes
// the Admin nav link + server guards fire for the owner even if ADMIN_EMAILS
// happens to be unset/mismatched on a given project.
export const canAccessAdmin = (email: string | null | undefined) => isOwner(email) || isAdmin(email);

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
// ⚠️ WHAT IS ACTUALLY SHIPPED — read this before quoting the split below.
// The design was a SKILL split (objective Listening/Reading free to any signed-in user; the
// AI-feedback skill and the sequenced mock paid). That is NOT what runs. Every practice
// surface — /practice, /practice/[track]/[section], /mock, /mock/[track] — ends a signed-in
// non-subscribed user with `redirect("/account")` before a section renders (the founder gate).
// So in the shipped product NOTHING is free to a signed-in learner: the offer is a 7-day
// card-trial on everything, then $12/month.
//
// This comment claimed the split was live, and that claim was load-bearing: /api/ko/submit
// cited it to justify shipping with no paid check, which left objective marking — and the
// correctOptionId it discloses — reachable without a subscription. Whichever way this is
// settled, these move TOGETHER: this file, the four page gates, /api/ko/submit,
// /api/ko/writing, PracticeGate's copy, and the /practice banner.
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
