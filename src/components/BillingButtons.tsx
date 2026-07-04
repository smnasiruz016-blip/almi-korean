"use client";

import { useState } from "react";

async function go(endpoint: string, setBusy: (b: boolean) => void, setErr: (s: string | null) => void) {
  setBusy(true);
  setErr(null);
  const res = await fetch(endpoint, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.url) {
    window.location.href = data.url;
  } else {
    setErr(data.error ?? "Something went wrong.");
    setBusy(false);
  }
}

export function BillingButtons({ hasSubscription }: { hasSubscription: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="mt-4">
      {hasSubscription ? (
        <button onClick={() => go("/api/billing/portal", setBusy, setErr)} disabled={busy} className="rounded-full border border-almi-line px-6 py-2.5 font-medium text-almi-ink hover:border-almi-coral disabled:opacity-60">
          {busy ? "Opening…" : "Manage subscription"}
        </button>
      ) : (
        <button onClick={() => go("/api/billing/checkout", setBusy, setErr)} disabled={busy} className="rounded-full bg-almi-coral px-6 py-2.5 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark disabled:opacity-60">
          {busy ? "Starting…" : "Start 7-day free trial — $12/mo"}
        </button>
      )}
      {err && <p className="mt-2 text-sm text-almi-coral-deep">{err}</p>}
    </div>
  );
}
