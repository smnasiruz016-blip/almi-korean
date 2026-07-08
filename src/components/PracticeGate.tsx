"use client";

import { useState } from "react";

// Subscribe gate for a paid surface (TOPIK II Writing feedback, or the sequenced mock).
// Listening/Reading practice stays free; this only fronts the paid features. Heading/body are
// overridable so the same gate serves both contexts; defaults describe the Writing skill.
// If Stripe isn't wired yet (billingLive=false) the subscribe button shows its honest unavailable
// state — the fail-closed path — rather than starting a checkout that can't complete.
export function PracticeGate({
  billingLive,
  heading = "Writing feedback is part of AlmiKorean Pro",
  body = "Listening and Reading are free. AI feedback on TOPIK II Writing — criteria-based, 100% original material — is $12/month. Start with a 7-day free trial: your card is saved but not charged, and you can cancel anytime before the trial ends and pay nothing.",
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
