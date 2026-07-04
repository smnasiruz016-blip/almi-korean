import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_SECTOR, EPS_PARTNERS } from "@/lib/seo/data";
import { canonical, SHAMOOL_LINE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ sector: string }> }): Promise<Metadata> {
  const { sector } = await params;
  const s = BY_SECTOR.get(sector);
  if (!s) return {};
  return {
    title: `EPS ${s.name} (E-9) — the work route to Korea, honestly explained`,
    description: `The ${s.name} (${s.nameKo}) sector under Korea's Employment Permit System: how E-9 hiring in this industry works, why a pass is not a job, and the 17 partner countries it is open to. No broker fees.`,
    alternates: { canonical: canonical(`/eps/sector/${s.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  const s = BY_SECTOR.get(sector);
  if (!s) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">EPS sector · E-9</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">EPS {s.name} ({s.nameKo})</h1>
      <p className="mt-4 text-almi-text">
        {s.name} is one of the main industry sectors under Korea&apos;s Employment Permit System (EPS) for the E-9 work visa. This
        page explains how the route works for this sector — honestly, with no fees and no promises.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">How E-9 hiring works here</h2>
      <p className="mt-2 text-almi-text">
        Workers sit <strong className="text-almi-ink">EPS-TOPIK</strong> (a different test from academic TOPIK), and those who pass
        join a roster. Korean employers in the {s.name.toLowerCase()} sector then select from that roster — a pass is a requirement,
        not a job offer or a visa. The sectors and quotas open each year are set by Korean policy; confirm the current {s.name}{" "}
        allocation at eps.go.kr. See{" "}
        <Link href="/topik-vs-eps-topik" className="text-almi-coral hover:underline">TOPIK vs EPS-TOPIK</Link>.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Who it is open to</h2>
      <p className="mt-2 text-almi-text">
        EPS operates only with the <strong className="text-almi-ink">{EPS_PARTNERS.length} partner countries</strong> that hold an
        MOU with Korea. If your country is one of them, start from its{" "}
        <Link href="/eps" className="text-almi-coral hover:underline">EPS corridor page</Link>. There is no legitimate broker fee —
        be cautious of anyone charging for guaranteed placement in this sector.
      </p>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
    </main>
  );
}
