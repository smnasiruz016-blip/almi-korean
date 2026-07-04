import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, BY_LEVEL } from "@/lib/seo/data";
import { canonical, nativeLead, NO_FLOORS_LINE, VALIDITY_LINE, SHAMOOL_LINE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ level: string; origin: string }> }): Promise<Metadata> {
  const { level, origin } = await params;
  const o = BY_ORIGIN.get(origin);
  const l = BY_LEVEL.get(level);
  if (!o || !l) return {};
  return {
    title: `TOPIK level ${l.level} from ${o.name} — cutoff ${l.cutoff}/${l.totalMax} (${l.trackLabel})`,
    description: `Prepare for TOPIK level ${l.level} from ${o.name}: it is awarded on ${l.trackLabel}, needs a total of ${l.cutoff}/${l.totalMax}, and has no section minimums. Practise with honest estimates — never a made-up score.`,
    alternates: { canonical: canonical(`/topik/${l.level}/from/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ level: string; origin: string }> }) {
  const { level, origin } = await params;
  const o = BY_ORIGIN.get(origin);
  const l = BY_LEVEL.get(level);
  if (!o || !l) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">TOPIK level {l.level} · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">TOPIK level {l.level} preparation from {o.name}</h1>
      <p className="mt-4 text-almi-text">{nativeLead(o)}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">What level {l.level} takes</h2>
      <p className="mt-2 text-almi-text">
        Level {l.level} is awarded on <strong className="text-almi-ink">{l.trackLabel}</strong>, scored out of {l.totalMax}. You
        reach it with a <strong className="text-almi-ink">total of at least {l.cutoff}/{l.totalMax}</strong> — and nothing else.{" "}
        {NO_FLOORS_LINE}
      </p>
      <p className="mt-3 rounded-lg bg-almi-bg-peach/50 p-3 text-sm text-almi-text">
        There is no &ldquo;fail&rdquo; in TOPIK: if your total is below {l.cutoff} you simply are not awarded level {l.level} on
        that sitting — you can register again. Levels 1–2 come from TOPIK I, levels 3–6 from TOPIK II; they are separate tests, not
        a single ladder.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Practise, don&apos;t predict</h2>
      <p className="mt-2 text-almi-text">
        Listening and Reading are point-based, so we show your raw score against the {l.cutoff}-point cutoff.
        {l.track === "TOPIK_II" ? " Writing is marked by AI against the official criteria and always labelled an estimate, never an official mark." : ""}{" "}
        Only NIIED&apos;s official sitting awards a level. {VALIDITY_LINE}
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
          Practise {l.trackLabel}
        </Link>
        <Link href="/topik/levels" className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">
          How the six levels work
        </Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
    </main>
  );
}
