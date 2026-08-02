"use client";

// The boundary that catches nearly everything real.
//
// ── WHY THIS EXISTS ALONGSIDE global-error.tsx ──
// global-error only fires when the ROOT LAYOUT itself throws, and it replaces the entire
// document — header, footer and all. Without this file, every ordinary page failure (a
// practice route, a university page, a data read) would fall through to that: the learner
// would lose the whole product chrome and any sense of where they were, for a fault in one
// page. This one renders INSIDE the root layout, so the header and footer survive and the
// error stays scoped to the thing that actually broke.
//
// Same honesty rules as global-error: our fault, saved work is safe, no raw `error.message`
// (Next redacts it to a digest in production precisely because it can carry internals), and
// the digest shown so a user's report matches a log line.

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">This page didn&apos;t load</h1>
      <p className="mt-4 text-almi-text">
        That is a fault on our side, not anything you did. Your account and your saved results are not
        affected.
      </p>
      <p className="mt-3 text-almi-text">
        Most of these clear on a second attempt. If it keeps happening, email{" "}
        <a className="text-almi-coral hover:underline" href="mailto:almiworld@almiworld.com">
          almiworld@almiworld.com
        </a>
        {error.digest ? " and quote the reference below — it points us straight at the log line." : "."}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark"
        >
          Try again
        </button>
        <Link
          href="/practice"
          className="rounded-full border border-almi-line px-7 py-3 font-medium text-almi-ink hover:border-almi-coral"
        >
          Back to practice
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-almi-text-muted">
          Reference: <code>{error.digest}</code>
        </p>
      )}
    </main>
  );
}
