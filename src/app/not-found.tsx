import type { Metadata } from "next";
import Link from "next/link";

// A 404 is not an error boundary's job — nothing threw — but it is the same failure from the
// learner's side: a dead end with no way back into the product. Next's default is a bare
// "404 | This page could not be found" with no navigation at all.
//
// This matters more here than on most sites. The product serves ~2.7M generated URLs
// (university × department × origin), so a mistyped or de-listed slug is a genuinely common
// way to arrive — and the useful response is not an apology but the routes back in.
//
// noindex: a 404 already carries the status code, but this page is reachable at any path and
// must never be indexed as content in its own right.

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">404</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">We couldn&apos;t find that page</h1>
      <p className="mt-4 text-almi-text">
        The link may be out of date, or the address may have a typo in it. Nothing is wrong with your
        account.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          { href: "/practice", label: "Practice", body: "TOPIK I and II — Listening, Reading and Writing." },
          { href: "/mock", label: "Mock test", body: "A sequenced run through a full track." },
          { href: "/topik/levels", label: "How levels work", body: "Total-based, no section minimums." },
          { href: "/", label: "Homepage", body: "Start again from the beginning." },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl border border-almi-line bg-almi-paper p-5 hover:border-almi-coral"
          >
            <p className="font-semibold text-almi-ink">{l.label}</p>
            <p className="mt-1 text-sm text-almi-text">{l.body}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
