import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, BY_UNI, DEPTS_BY_UNI, isEpsOrigin } from "@/lib/seo/data";
import { canonical, nativeLead, KCUE_ATTRIBUTION, SHAMOOL_LINE, REQ_NOT_GUARANTEE, VALIDITY_LINE } from "@/lib/seo/content";

// Pure on-demand ISR: nothing prerendered, each page rendered on first request + cached.
// The sitemap enumerates all 384×196 URLs for crawl. Unknown uni/origin → 404.
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ uni: string; origin: string }> }): Promise<Metadata> {
  const { uni, origin } = await params;
  const u = BY_UNI.get(uni);
  const o = BY_ORIGIN.get(origin);
  if (!u || !o) return {};
  const en = u.nameEnGenerated ? u.nameKo : u.nameEn;
  return {
    title: `Study at ${en} from ${o.name} — TOPIK expectations`,
    description: `${en} (${u.type}, ${u.region}) for students from ${o.name}: honest TOPIK level expectations, Korean- vs English-taught reality, and how to prepare. Admission is a university decision, not a visa.`,
    alternates: { canonical: canonical(`/university/${u.slug}/from/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ uni: string; origin: string }> }) {
  const { uni, origin } = await params;
  const u = BY_UNI.get(uni);
  const o = BY_ORIGIN.get(origin);
  if (!u || !o) notFound();

  const depts = DEPTS_BY_UNI.get(u.slug) ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Study in Korea · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{u.nameKo}</h1>
      <p className="mt-1 text-sm text-almi-text-muted">
        {u.nameEnGenerated ? (
          <>
            {u.nameEn} <span className="italic">(romanized — not the official English name)</span> ·{" "}
          </>
        ) : (
          <>{u.nameEn} · </>
        )}
        {u.type} · {u.region}
      </p>
      <p className="mt-4 text-almi-text">{nativeLead(o)}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Korean-language expectations</h2>
      <p className="mt-2 text-almi-text">
        Requirements are set per institution — always verify with the university. As an honest split:{" "}
        <strong className="text-almi-ink">Korean-taught degree programs</strong> commonly expect TOPIK level 3–4, while{" "}
        <strong className="text-almi-ink">English-taught programs</strong> typically need no TOPIK at all. Some universities also
        accept KIIP or Sejong Institute study in place of a TOPIK level. There is no single national threshold, and admission is a
        university decision — <em>not</em> a visa and not a guarantee.
      </p>
      <p className="mt-3 text-sm text-almi-text-muted">{REQ_NOT_GUARANTEE}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Prepare your TOPIK from {o.name}</h2>
      <p className="mt-2 text-almi-text">
        If your target program is Korean-taught, practise the tested sections before you commit to a level. TOPIK has{" "}
        <strong className="text-almi-ink">no section minimums</strong> — your level is decided by your total alone — so we show raw
        performance against each level&apos;s real cutoff, never a fabricated score. {VALIDITY_LINE}
      </p>

      {depts.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-almi-ink">Departments at {u.nameEnGenerated ? u.nameKo : u.nameEn}</h2>
          <p className="mt-2 text-sm text-almi-text">
            {depts.length} active {depts.length === 1 ? "department" : "departments"} from the official course-unit disclosure —
            TOPIK expectations are set per department, so open one for the honest detail.
          </p>
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {depts.map((d) => (
              <li key={d.slug}>
                <Link href={`/university/${u.slug}/${d.slug}/from/${o.slug}`} className="text-sm text-almi-coral hover:underline">
                  {d.nameKo}
                </Link>
                {d.degree ? <span className="text-xs text-almi-text-muted"> · {d.degree}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
          Practise TOPIK
        </Link>
        <Link href={`/study-in-korea/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">
          Studying in Korea from {o.name}
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
