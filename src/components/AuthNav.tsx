"use client";

// Session-aware product nav for the family header. The header shell stays a
// static server component (keeps SEO pages static); this small client piece
// asks /api/me who's logged in and swaps the links:
//   logged out -> Practice · Log in · [Practise free CTA]
//   logged in  -> Practice · Account
// First paint (server + first client render) shows the logged-out set, which
// matches SSR markup (no hydration mismatch) and is correct for the common
// anonymous visitor; it swaps once /api/me resolves.

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { loggedIn: boolean; email: string | null };

export function AuthNav() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Me) => { if (alive) setMe(d); })
      .catch(() => { if (alive) setMe({ loggedIn: false, email: null }); });
    return () => { alive = false; };
  }, []);

  const loggedIn = me?.loggedIn ?? false;

  return (
    <nav aria-label="AlmiKorean" className="flex items-center gap-3 text-sm">
      <Link href="/practice" className="font-medium text-almi-ink hover:text-almi-coral">
        Practice
      </Link>
      <Link href="/mock" className="font-medium text-almi-ink hover:text-almi-coral">
        Mock test
      </Link>
      {loggedIn ? (
        <Link href="/account" className="font-medium text-almi-ink hover:text-almi-coral">
          Account
        </Link>
      ) : (
        <>
          <Link href="/login" className="font-medium text-almi-ink hover:text-almi-coral">
            Log in
          </Link>
          <Link
            href="/signup"
            className="ml-1 inline-flex min-h-[40px] items-center justify-center rounded-full bg-almi-coral px-5 py-2 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark"
          >
            Practise free
          </Link>
        </>
      )}
    </nav>
  );
}
