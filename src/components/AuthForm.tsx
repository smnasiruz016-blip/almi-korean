"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INPUT =
  "mt-2 w-full rounded-xl border border-almi-ink/15 bg-almi-bg px-4 py-3 text-sm text-almi-ink focus:border-almi-coral focus:outline-none focus:ring-2 focus:ring-almi-coral/20";
const LABEL = "block text-sm font-medium text-almi-ink";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      ...(mode === "signup" ? { name: String(fd.get("name") ?? "") || undefined } : {}),
    };
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      // Land in the app-shell/account world (sidebar + prominent trial CTA),
      // matching the AlmiPrep journey: signup → account → Start 7-day free
      // trial → Stripe checkout.
      router.push(mode === "signup" ? "/account?welcome=true" : "/account");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {mode === "signup" && (
        <div>
          <label htmlFor="name" className={LABEL}>
            Name
          </label>
          <input id="name" name="name" autoComplete="name" className={INPUT} />
        </div>
      )}
      <div>
        <label htmlFor="email" className={LABEL}>
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={INPUT} />
      </div>
      <div>
        <label htmlFor="password" className={LABEL}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : 1}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className={INPUT}
        />
        {mode === "signup" && (
          <p className="mt-2 text-xs text-almi-text-muted">At least 8 characters.</p>
        )}
      </div>
      {error && <p className="text-sm text-almi-coral-deep">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full min-h-[44px] items-center justify-center rounded-full bg-almi-coral px-6 py-3 text-sm font-semibold text-almi-ink transition-colors hover:bg-almi-coral-deep hover:text-almi-on-dark focus:outline-none focus:ring-4 focus:ring-almi-coral/30 disabled:opacity-60"
      >
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
