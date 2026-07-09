import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/access";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "TOPIK mock test — full sequenced practice",
  description:
    "Sit a sequenced TOPIK mock: TOPIK I runs Listening then Reading; TOPIK II adds Writing. Your section scores combine into a total and a practice level estimate from the real cutoffs.",
  alternates: { canonical: canonical("/mock") },
};

const TRACKS = [
  { slug: "topik-i", label: "TOPIK I mock", sub: "Listening → Reading · Levels 1–2 · out of 200" },
  { slug: "topik-ii", label: "TOPIK II mock", sub: "Listening → Writing → Reading · Levels 3–6 · out of 300" },
];

export default async function Page() {
  // FOUNDER GATE (trio): logged-in non-subscribed users see no practice path — funnel to the
  // trial checkout on /account. Logged-out visitors keep this public SEO surface.
  const user = await getCurrentUser();
  if (user && !hasPaidAccess(user)) redirect("/account");
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Mock test</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Sit a sequenced mock</h1>
      <p className="mt-4 text-almi-text">
        Sections run in order, with no marking shown until the end — then your section scores combine into a total and a practice
        level estimate against the real cutoffs. A shorter run than the full exam, built from the practice bank.
      </p>
      <p className="mt-3 text-sm text-almi-text-muted">
        The full sequenced mock and all TOPIK practice are part of AlmiKorean Pro — $12/month with a 7-day free trial
        (card saved, not charged).
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {TRACKS.map((t) => (
          <Link key={t.slug} href={`/mock/${t.slug}`} className="rounded-2xl border border-almi-line bg-almi-paper p-6 hover:border-almi-coral">
            <p className="font-semibold text-almi-ink">{t.label}</p>
            <p className="mt-2 text-sm text-almi-text">{t.sub}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
