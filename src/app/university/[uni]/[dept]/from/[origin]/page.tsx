import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, BY_UNI, BY_DEPT, type Department } from "@/lib/seo/data";
import { canonical, nativeLead, KCUE_ATTRIBUTION, SHAMOOL_LINE, REQ_NOT_GUARANTEE, VALIDITY_LINE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

// Honest one-line explanation for a special department characteristic (spec §2 item 4). Regular
// departments get no label. Never framed as ordinary open admission.
function charNote(d: Department): string | null {
  switch (d.charClass) {
    case "contract":
      return "Contract department — tied to specific employer arrangements, not ordinary open admission.";
    case "industry-commissioned":
      return "Industry-commissioned track — places are sponsored by an employer, not open enrolment.";
    case "degree-completion":
      return "Bachelor's-completion track — a degree-deepening course for junior-college graduates.";
    default:
      return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ uni: string; dept: string; origin: string }> }): Promise<Metadata> {
  const { uni, dept, origin } = await params;
  const u = BY_UNI.get(uni);
  const d = BY_DEPT.get(`${uni}/${dept}`);
  const o = BY_ORIGIN.get(origin);
  if (!u || !d || !o) return {};
  const en = u.nameEnGenerated ? u.nameKo : u.nameEn;
  return {
    title: `${d.nameKo} at ${en} from ${o.name} — TOPIK & admission`,
    description: `${d.nameKo} (${d.degree}) at ${en} for students from ${o.name}: honest TOPIK expectations, per-department admission reality, and how to prepare. Admission is a university decision, not a visa.`,
    alternates: { canonical: canonical(`/university/${u.slug}/${d.slug}/from/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ uni: string; dept: string; origin: string }> }) {
  const { uni, dept, origin } = await params;
  const u = BY_UNI.get(uni);
  const d = BY_DEPT.get(`${uni}/${dept}`);
  const o = BY_ORIGIN.get(origin);
  if (!u || !d || !o) notFound();

  const note = charNote(d);
  const uniEn = u.nameEnGenerated ? u.nameKo : u.nameEn;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Study in Korea · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{d.nameKo}</h1>
      <p className="mt-1 text-sm text-almi-text-muted">
        {d.nameEn} <span className="italic">(romanized)</span> · {uniEn} · {u.region}
      </p>
      <p className="mt-2 text-sm text-almi-text">
        <Link href={`/university/${u.slug}/from/${o.slug}`} className="text-almi-coral hover:underline">← {uniEn}</Link>
        {d.college && d.college !== "단과대구분없음" ? ` · ${d.college}` : ""}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-almi-line bg-almi-paper p-5 text-sm sm:grid-cols-3">
        {d.degree && (<div><dt className="text-almi-text-muted">Degree</dt><dd className="font-medium text-almi-ink">{d.degree}</dd></div>)}
        {d.years && (<div><dt className="text-almi-text-muted">Length</dt><dd className="font-medium text-almi-ink">{d.years}</dd></div>)}
        {d.dayNight.length > 0 && (<div><dt className="text-almi-text-muted">Schedule</dt><dd className="font-medium text-almi-ink">{d.dayNight.join(" · ")}</dd></div>)}
        {d.series.length > 0 && (<div className="col-span-2 sm:col-span-3"><dt className="text-almi-text-muted">Field</dt><dd className="font-medium text-almi-ink">{d.series.join(" › ")}</dd></div>)}
      </dl>

      {note && <p className="mt-4 rounded-lg bg-almi-bg-peach/50 p-3 text-sm text-almi-text"><strong className="text-almi-ink">Note:</strong> {note}</p>}

      <p className="mt-6 text-almi-text">{nativeLead(o)}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">TOPIK &amp; admission for {d.nameKo}</h2>
      <p className="mt-2 text-almi-text">
        Admission requirements are set <strong className="text-almi-ink">per department</strong>, so always verify with{" "}
        {uniEn}. As an honest convention, Korean-taught programs commonly expect TOPIK level 3–4. We do not know this
        department&apos;s language of instruction — the public dataset doesn&apos;t record it — so we won&apos;t claim it&apos;s
        Korean- or English-taught; confirm directly. {REQ_NOT_GUARANTEE}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Prepare your TOPIK from {o.name}</h2>
      <p className="mt-2 text-almi-text">
        If your program is Korean-taught, practise the tested sections before you commit to a level. TOPIK has no section
        minimums — your total alone decides your level — so we show raw performance against each level&apos;s real cutoff, never a
        fabricated score. {VALIDITY_LINE}
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
          Practise TOPIK
        </Link>
        <Link href={`/university/${u.slug}/from/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">
          All of {uniEn}&apos;s departments
        </Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">{KCUE_ATTRIBUTION}</p>
    </main>
  );
}
