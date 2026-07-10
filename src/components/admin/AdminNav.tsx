"use client";

// Sub-nav shown at the top of every /admin page (via (app)/admin/layout.tsx)
// so the founder can move between admin sections. Add a tab here when a new
// admin page lands. (Ported from AlmiPrep; the trio ships the two schema-
// compatible tabs — Accounts + Comp Accounts.)

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/comp-accounts", label: "Comp Accounts" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="flex flex-wrap gap-2 border-b border-almi-bg-peach pb-4 text-sm">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={
              "rounded-md px-3 py-1.5 font-semibold " +
              (active
                ? "bg-almi-coral text-almi-ink"
                : "border border-almi-bg-peach text-almi-text hover:border-almi-coral")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
