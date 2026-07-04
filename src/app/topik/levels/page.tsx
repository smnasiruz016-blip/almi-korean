import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "TOPIK levels 1–6 explained (two tests, six levels)",
  description:
    "TOPIK runs as two separate tests — TOPIK I awards Levels 1–2, TOPIK II awards Levels 3–6. What each level means, how the cutoffs work, and why there is no 'fail'.",
  alternates: { canonical: canonical("/topik/levels") },
};

const LEVELS = [
  { lv: 1, track: "TOPIK I", d: "Basic survival Korean: greetings, self-introduction, shopping, ordering — familiar everyday exchanges." },
  { lv: 2, track: "TOPIK I", d: "Everyday and public-facing language (post office, bank), familiar-topic conversation, simple connected text." },
  { lv: 3, track: "TOPIK II", d: "Everyday and some social language; managing familiar tasks and reading straightforward paragraphs." },
  { lv: 4, track: "TOPIK II", d: "News, common workplace and social topics — the level universities and employers most often reference." },
  { lv: 5, track: "TOPIK II", d: "Social, academic and professional topics; less-familiar themes handled with relative ease." },
  { lv: 6, track: "TOPIK II", d: "Near-full functional command: specialised, abstract and unfamiliar material read and understood." },
];

export default function Page() {
  return (
    <Article
      eyebrow="Levels"
      title="TOPIK levels 1–6 (two tests, six levels)"
      lede="TOPIK is not one exam with six levels — it is two separate tests. You register for the track you want and can sit TOPIK II directly."
    >
      <p>
        <strong>TOPIK I</strong> (Listening + Reading) awards Levels 1–2. <strong>TOPIK II</strong> (Listening + Writing + Reading)
        awards Levels 3–6. They are separate registrations: you do not have to pass TOPIK I before sitting TOPIK II. Your level is
        decided by your total against fixed cutoffs — a strong section makes up for a weaker one, because there are no section
        minimums. See{" "}
        <Link href="/topik/how-scoring-works" className="text-almi-coral hover:underline">how the cutoffs work</Link>.
      </p>
      <div className="space-y-3">
        {LEVELS.map(({ lv, track, d }) => (
          <div key={lv} className="rounded-xl border border-almi-line bg-almi-paper p-4">
            <p className="font-semibold text-almi-ink">Level {lv} <span className="ml-2 text-xs font-medium uppercase tracking-wide text-almi-coral">{track}</span></p>
            <p className="mt-1 text-sm text-almi-text">{d}</p>
          </div>
        ))}
      </div>
      <h2>There is no &quot;fail&quot;</h2>
      <p>
        If your total is below the lowest cutoff, no level is awarded and no certificate is issued. That is not a failing grade —
        it simply means no level yet. You can sit again; earlier results are not cancelled, and more than one valid certificate can
        coexist.
      </p>
      <h2>A note on CEFR</h2>
      <p>
        You will see charts mapping TOPIK levels onto the CEFR (A1–C2). Those mappings are <strong>unofficial</strong> — NIIED does
        not publish a CEFR equivalence. Treat any such comparison as rough orientation only, never as an official equivalence.
      </p>
      <p>
        TOPIK results are announced about a month after the test, and a certificate is <strong>valid for two years</strong> — see{" "}
        <Link href="/topik/validity" className="text-almi-coral hover:underline">why that two-year window matters for timing</Link>.
      </p>
    </Article>
  );
}
