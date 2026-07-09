"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      // Land in the app-shell/account world (sidebar + trial CTA), matching the
      // Goethe/CELPIP journey: signup → account → Start 7-day free trial → checkout.
      router.push(mode === "signup" ? "/account?welcome=true" : "/account");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-sm space-y-3">
      {mode === "signup" && (
        <input name="name" placeholder="Name (optional)" className="w-full rounded-lg border border-almi-line bg-almi-paper px-3 py-2" />
      )}
      <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-almi-line bg-almi-paper px-3 py-2" />
      <input name="password" type="password" required minLength={mode === "signup" ? 8 : 1} placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"} className="w-full rounded-lg border border-almi-line bg-almi-paper px-3 py-2" />
      {error && <p className="text-sm text-almi-coral-deep">{error}</p>}
      <button disabled={busy} className="rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark disabled:opacity-60">
        {busy ? "Please wait…" : mode === "signup" ? "Create account & practise" : "Log in"}
      </button>
    </form>
  );
}
