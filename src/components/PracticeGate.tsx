"use client";

import { useState } from "react";

// Subscribe gate for a paid surface. Heading/body are overridable so the same gate serves both
// the practice and mock contexts.
//
// The default body used to open "Listening and Reading are free." They are not: every practice
// surface redirects a signed-in non-subscribed user to /account before a section renders, so
// there is no free tier to point at. Saying so in the one place a learner meets the paywall was
// the worst place to be wrong — it promised something the very next click disproved. The offer
// is a 7-day card trial on everything, which is what this now says.
//
// If Stripe isn't wired yet (billingLive=false) the subscribe button shows its honest unavailable
// state — the fail-closed path — rather than starting a checkout that can't complete.
export function PracticeGate({
  billingLive,
  heading = "Practice is part of AlmiKorean Pro",
  body = "Both TOPIK tracks — auto-marked Listening and Reading, and criteria-based AI feedback on TOPIK II Writing, 100% original material — are $12/month. Start with a 7-day free trial: your card is saved but not charged, and you can cancel anytime before the trial ends and pay nothing.",
}: {
  billingLive: boolean;
  heading?: string;
  body?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const subscribe = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; return; }
      setErr(data.error ?? "Could not start checkout. Please try again.");
    } catch {
      setErr("Could not start checkout. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-almi-line bg-almi-paper p-6">
      <h2 className="text-lg font-semibold text-almi-ink">{heading}</h2>
      <p className="mt-2 text-sm text-almi-text">{body}</p>
      <button
        onClick={subscribe}
        disabled={busy || !billingLive}
        className="mt-4 inline-flex rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark disabled:opacity-60"
      >
        {busy ? "Starting…" : !billingLive ? "Checkout unavailable" : "Start 7-day free trial"}
      </button>
      {!billingLive && (
        <p className="mt-2 text-xs text-almi-text-muted">Subscriptions are being switched on. Please check back shortly.</p>
      )}
      {err && <p className="mt-2 text-xs text-almi-coral-deep">{err}</p>}
    </div>
  );
}
