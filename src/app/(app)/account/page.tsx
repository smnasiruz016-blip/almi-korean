import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { hasPaidAccess, isBillingEnabled, isOwner } from "@/lib/access";
import { BillingButtons } from "@/components/BillingButtons";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const paid = hasPaidAccess(user);
  const billingOn = isBillingEnabled();

  const planLabel = isOwner(user.email)
    ? "Owner — full access"
    : paid
      ? `Active (${user.subscriptionStatus ?? "trialing"})`
      : "Free";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Account</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{user.name ?? user.email}</h1>
      <p className="mt-1 text-sm text-almi-text-muted">{user.email}</p>

      {sp.welcome && !paid && (
        <div className="mt-6 rounded-2xl border border-almi-coral/30 bg-almi-coral/10 p-4">
          <p className="text-sm text-almi-ink">
            Welcome — your account is ready. Start your 7-day free trial below to unlock the full timed mock and premium features. Listening and Reading practice are free to use right away.
          </p>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-almi-line bg-almi-paper p-6">
        <p className="text-almi-text">Plan: <strong className="text-almi-ink">{planLabel}</strong></p>
        {!billingOn ? (
          <p className="mt-2 text-sm text-almi-text-muted">
            Subscriptions open shortly. Meanwhile, free practice is fully available.
          </p>
        ) : (
          !isOwner(user.email) && <BillingButtons hasSubscription={Boolean(user.stripeSubscriptionId)} />
        )}
      </div>

      <div className="mt-6 flex items-center gap-4 text-sm">
        <Link href="/practice" className="text-almi-coral hover:underline">Go to practice</Link>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="text-almi-text-muted hover:text-almi-coral">Log out</button>
        </form>
      </div>
    </main>
  );
}
