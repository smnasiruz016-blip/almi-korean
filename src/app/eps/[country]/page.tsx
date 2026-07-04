import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_EPS, EPS_SECTORS } from "@/lib/seo/data";
import { canonical, SHAMOOL_LINE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const p = BY_EPS.get(country);
  if (!p) return {};
  return {
    title: `EPS-TOPIK from ${p.name} — the work route to Korea, honestly explained`,
    description: `${p.name} is one of the 17 EPS partner countries. What EPS-TOPIK is (a different test from academic TOPIK), how the E-9 work route really works, quota reality, and why a pass is not a job. No broker fees.`,
    alternates: { canonical: canonical(`/eps/${p.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const p = BY_EPS.get(country);
  if (!p) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">EPS corridor · {p.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">The EPS work route to Korea from {p.name}</h1>
      <p className="mt-4 text-almi-text">
        {p.name} is one of the <strong className="text-almi-ink">17 countries</strong> with an Employment Permit System (EPS)
        agreement with Korea{p.newest ? " — the newest, added under an MOU signed on 31 October 2024" : ""}. This page explains the
        route honestly; it is not a broker and charges nothing.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">EPS-TOPIK is not academic TOPIK</h2>
      <p className="mt-2 text-almi-text">
        The test for this route is <strong className="text-almi-ink">EPS-TOPIK</strong>, run by HRD Korea for the E-9 work visa. It
        is a <em>different exam</em> from the academic TOPIK used for university admission — different body, format and purpose.
        Practising academic TOPIK helps your Korean generally, but the EPS route is registered and sat separately. See{" "}
        <Link href="/topik-vs-eps-topik" className="text-almi-coral hover:underline">TOPIK vs EPS-TOPIK</Link>.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">How applicants from {p.name} apply</h2>
      <p className="mt-2 text-almi-text">
        Each partner country applies through its own government-designated sending agency, under the bilateral MOU with Korea. The
        current designated body, test schedule and rules for {p.name} are published by HRD Korea — confirm them at eps.go.kr rather
        than through any private agent. There is <strong className="text-almi-ink">no legitimate broker fee</strong> for EPS; be wary
        of anyone charging for &ldquo;guaranteed&rdquo; selection.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">A pass is not a job</h2>
      <p className="mt-2 text-almi-text">
        Passing EPS-TOPIK places you on a <strong className="text-almi-ink">roster</strong> — Korean employers then select workers
        from it. Passing does not guarantee selection or a visa. Korea sets an annual E-9 quota (for 2026 the plan is around{" "}
        <strong className="text-almi-ink">80,000</strong>, a sharp cut from the prior year — verify the current figure and your
        country&apos;s share at the official source). Competition is real, so a strong result matters, but honesty matters more:
        selection is not promised.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">E-9 sectors</h2>
      <p className="mt-2 text-almi-text">
        EPS hiring is organised by industry. The main E-9 sectors are{" "}
        {EPS_SECTORS.map((s, i) => (
          <span key={s.slug}>
            <Link href={`/eps/sector/${s.slug}`} className="text-almi-coral hover:underline">{s.name}</Link>
            {i < EPS_SECTORS.length - 1 ? ", " : ""}
          </span>
        ))}
        . The exact sectors open each year are set by policy — verify the current list at eps.go.kr.
      </p>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">
        EPS partner list and quota reflect secondary reporting pending an official eps.go.kr / MOEL lock at build; figures are
        directional, not issued by the Government of the Republic of Korea.
      </p>
    </main>
  );
}
