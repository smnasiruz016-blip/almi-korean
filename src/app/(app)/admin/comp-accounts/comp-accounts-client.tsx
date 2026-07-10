"use client";

// Comp Accounts admin UI. Grant complimentary Pro access (no Stripe) with an
// expiry; extend (+30d) or revoke. Neutral styling so the panel reads the same
// across the AlmiWorld family. Revoke confirms via window.confirm (no modal
// dependency).

import { useState, useTransition } from "react";
import type { CompAccountRow } from "@/lib/admin/comp-accounts";

type GrantInput = { email: string; days?: number };
type RevokeInput = { userId: string };
type ExtendInput = { userId: string; additionalDays: number };

type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true } & T)
  | { ok: false; error: string };

type Props = {
  accounts: CompAccountRow[];
  loadError: string | null;
  grantAction: (input: GrantInput) => Promise<ActionResult<{ userId: string }>>;
  revokeAction: (input: RevokeInput) => Promise<ActionResult>;
  extendAction: (input: ExtendInput) => Promise<ActionResult>;
};

type Note = { kind: "ok" | "error"; text: string } | null;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CompAccountsClient({
  accounts,
  loadError,
  grantAction,
  revokeAction,
  extendAction,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<Note>(null);

  const [email, setEmail] = useState("");
  const [days, setDays] = useState("90");

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setNote({ kind: "error", text: "Email is required" });
      return;
    }
    const numDays = Number.parseInt(days, 10);
    if (!Number.isFinite(numDays) || numDays <= 0) {
      setNote({ kind: "error", text: "Days must be a positive number" });
      return;
    }
    startTransition(async () => {
      const r = await grantAction({
        email: trimmedEmail,
        days: numDays,
      });
      if (r.ok) {
        setNote({ kind: "ok", text: `Granted Pro to ${trimmedEmail} for ${numDays} days` });
        setEmail("");
        setDays("90");
      } else {
        setNote({ kind: "error", text: r.error });
      }
    });
  };

  const handleExtend = (row: CompAccountRow) => {
    startTransition(async () => {
      const r = await extendAction({ userId: row.userId, additionalDays: 30 });
      setNote(
        r.ok
          ? { kind: "ok", text: `Extended ${row.email} by 30 days` }
          : { kind: "error", text: r.error },
      );
    });
  };

  const handleRevoke = (row: CompAccountRow) => {
    if (!window.confirm(`Revoke comp Pro for ${row.email}? They revert to Free-tier limits on their next request.`)) {
      return;
    }
    startTransition(async () => {
      const r = await revokeAction({ userId: row.userId });
      setNote(
        r.ok
          ? { kind: "ok", text: `Revoked comp for ${row.email}` }
          : { kind: "error", text: r.error },
      );
    });
  };

  const active = accounts.filter((a) => a.isActive);
  const expired = accounts.filter((a) => !a.isActive);

  const inputCls =
    "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Comp Accounts</h1>
        <p className="mt-1 text-sm text-gray-600">
          Grant complimentary Pro access without payment — unlimited practice and
          AI evaluation. Comp grants short-circuit the Stripe and email-verification
          checks and expire on the date you set.
        </p>
      </header>

      {(note || loadError) && (
        <div
          className={
            "rounded-lg border px-4 py-3 text-sm " +
            (note?.kind === "error" || (loadError && !note)
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700")
          }
        >
          {note?.text ?? loadError}
        </div>
      )}

      {/* Grant */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Grant new comp account</h2>
        <form onSubmit={handleGrant} className="mt-4 grid gap-3 sm:grid-cols-12">
          <label className="sm:col-span-8">
            <span className="block text-xs font-medium text-gray-500">User email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tester@example.com"
              className={inputCls}
            />
          </label>
          <label className="sm:col-span-4">
            <span className="block text-xs font-medium text-gray-500">Days</span>
            <input
              type="number"
              min={1}
              max={1825}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={inputCls}
            />
          </label>
          <div className="sm:col-span-12">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Working…" : "Grant comp Pro"}
            </button>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          Comp grants
          <span className="ml-2 text-xs font-normal text-gray-400">
            {active.length} active · {expired.length} expired
          </span>
        </h2>

        {accounts.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No comp accounts yet. Grant one above to get started.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Expires</th>
                  <th className="py-2 pr-3 font-medium">Days left</th>
                  <th className="py-2 pr-0 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...active, ...expired].map((row) => (
                  <tr
                    key={row.userId}
                    className={
                      "border-b border-gray-100 " +
                      (row.isActive ? "text-gray-900" : "text-gray-400")
                    }
                  >
                    <td className="py-2 pr-3">
                      <div className="font-medium">{row.email}</div>
                      {row.name && <div className="text-xs text-gray-500">{row.name}</div>}
                    </td>
                    <td className="py-2 pr-3">{formatDate(row.compProUntil)}</td>
                    <td className="py-2 pr-3">
                      {row.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          {row.daysRemaining} d
                        </span>
                      ) : (
                        <span className="text-xs">Expired</span>
                      )}
                    </td>
                    <td className="py-2 pr-0 text-right">
                      <div className="inline-flex items-center gap-1">
                        {row.isActive && (
                          <button
                            type="button"
                            onClick={() => handleExtend(row)}
                            disabled={pending}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            +30 d
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRevoke(row)}
                          disabled={pending}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
