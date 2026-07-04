import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, UNIVERSITIES, isEpsOrigin } from "@/lib/seo/data";
import { canonical, nativeLead, KCUE_ATTRIBUTION, REQ_NOT_GUARANTEE, SHAMOOL_LINE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ origin: string }> }): Promise<Metadata> {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) return {};
  return {
    title: `Study in Korea from ${o.name} — TOPIK expectations & honest routes`,
    description: `Studying in Korea from ${o.name}: the honest split between Korean-taught (TOPIK 3–4 commonly expected) and English-taught (usually no TOPIK) programs, across ${UNIVERSITIES.length} active universities and colleges. Admission is not a visa.`,
    alternates: { canonical: canonical(`/study-in-korea/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ origin: string }> }) {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Study in Korea · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Studying in Korea from {o.name}</h1>
      <p className="mt-4 text-almi-text">{nativeLead(o)}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">The honest TOPIK split</h2>
      <p className="mt-2 text-almi-text">
        Korea has {UNIVERSITIES.length} active main-campus universities and colleges recruiting students. Language expectations are
        set per institution, never nationally: <strong className="text-almi-ink">Korean-taught degree programs</strong> commonly
        expect TOPIK level 3–4, while a number of <strong className="text-almi-ink">English-taught programs</strong> need no TOPIK at
        all. Some universities accept KIIP or Sejong Institute study instead. Always verify the exact requirement with the
        university — admission is a university decision. {REQ_NOT_GUARANTEE}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Scholarships &amp; the GKS route</h2>
      <p className="mt-2 text-almi-text">
        The Global Korea Scholarship (GKS) is the main government scholarship; its rules and participating universities are published
        officially each round on studyinkorea.go.kr, so we point you there rather than inventing a list or a threshold.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Prepare from {o.name}</h2>
      <p className="mt-2 text-almi-text">
        If your target program is Korean-taught, practise the tested sections and track your total against each level&apos;s real
        cutoff before committing to a target — TOPIK has no section minimums, so your total is all that decides your level.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
          Practise TOPIK
        </Link>
        <Link href={`/topik-in/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">
          Taking TOPIK from {o.name}
        </Link>
        {isEpsOrigin(o) && (
          <Link href="/eps" className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">
            Work route (EPS) →
          </Link>
        )}
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">{KCUE_ATTRIBUTION}</p>
    </main>
  );
}
