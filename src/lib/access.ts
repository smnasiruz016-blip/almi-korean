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

// PAID ACCESS: the owner, an admin comp, or a Stripe subscription that is `trialing` (a card
// trial that was already running keeps its own end date) or `active`. Unchanged by RR-397.
//
// RR-397 (owner, 8 Nov 2026): the free 48 hours (no card, from sign-up) are NOT decided here.
// They are a separate, narrower door in ./taste.ts + ./free-access.ts, asked only after this
// function has said no:
//   - hasPracticeAccess(): /practice, /practice/[track]/[section], /mock (the list) and
//     /api/ko/submit (objective marking, no AI);
//   - aiGate(): /api/ko/writing — ONE AI-scored Writing per free account, within today's
//     free-AI budget (./free-ai-budget.ts);
//   - the sequenced mock (/mock/[track]) stays paid only.
// These move TOGETHER: this file, free-access.ts, the page gates and the two API routes.
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
