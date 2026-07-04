import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, isEpsOrigin } from "@/lib/seo/data";
import { canonical, nativeLead, VALIDITY_LINE, NO_FLOORS_LINE, SHAMOOL_LINE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ origin: string }> }): Promise<Metadata> {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) return {};
  return {
    title: `TOPIK in ${o.name} — how and where to take the test`,
    description: `Taking TOPIK from ${o.name}: overseas sittings, the two separate tests (TOPIK I & II), the 2-year validity, and honest registration guidance. Practise levels 1–6 with real cutoffs.`,
    alternates: { canonical: canonical(`/topik-in/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ origin: string }> }) {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">TOPIK · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Taking TOPIK from {o.name}</h1>
      <p className="mt-4 text-almi-text">{nativeLead(o)}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Where and when</h2>
      <p className="mt-2 text-almi-text">
        Inside Korea, TOPIK runs about six times a year. <strong className="text-almi-ink">Overseas, sittings are fewer</strong> —
        commonly two to four rounds a year, held by local Korean embassies and Korean Education Centers. The exact centers and dates
        for {o.name} are set each year by NIIED and the local mission, so confirm them on the official site (topik.go.kr) before you
        plan — we do not invent center lists. If no center operates near you, candidates often register at the nearest hosting
        country.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Which test to register for</h2>
      <p className="mt-2 text-almi-text">
        TOPIK I and TOPIK II are <strong className="text-almi-ink">separate registrations</strong>, not a ladder: TOPIK I awards
        levels 1–2, TOPIK II awards levels 3–6. Pick the one that matches your target level. {NO_FLOORS_LINE}
      </p>
      <p className="mt-3 rounded-lg bg-almi-bg-peach/50 p-3 text-sm text-almi-text">{VALIDITY_LINE}</p>

      {isEpsOrigin(o) && (
        <p className="mt-4 text-sm text-almi-text">
          Note for {o.name}: for the <strong className="text-almi-ink">work</strong> route to Korea, the relevant test is the
          separate <strong className="text-almi-ink">EPS-TOPIK</strong> (a different exam run by HRD Korea), not the academic TOPIK
          on this page — see the <Link href="/topik-vs-eps-topik" className="text-almi-coral hover:underline">TOPIK vs EPS-TOPIK</Link> explainer.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
          Practise TOPIK
        </Link>
        <Link href={`/study-in-korea/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">
          Studying in Korea from {o.name}
        </Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
    </main>
  );
}
