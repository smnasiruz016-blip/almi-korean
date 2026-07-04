import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "TOPIK II Writing guide — Tasks 51 to 54",
  description:
    "The four TOPIK II Writing tasks explained: two short completions (51–52), a 200–300 character descriptive piece (53), and a 600–700 character essay (54). What each asks and how it's judged.",
  alternates: { canonical: canonical("/topik/writing-guide") },
};

const TASKS = [
  { n: 51, band: "no fixed length", d: "A short practical text — a notice, message or email — with two blanks to complete. Write one natural clause or sentence per blank, matching the register and purpose of the text." },
  { n: 52, band: "no fixed length", d: "A short expository paragraph with two blanks. Each blank needs a logically fitting sentence, using the connective and academic tone the surrounding text sets up." },
  { n: 53, band: "200–300 characters", d: "A descriptive/expository piece built from given data or a described situation. Organise the information clearly and cover the points asked, within the character band." },
  { n: 54, band: "600–700 characters", d: "An argumentative essay on an abstract topic, usually with two or three guiding sub-questions. State a position, support it with reasons, and structure it with a clear opening, body and close." },
];

export default function Page() {
  return (
    <Article
      eyebrow="Writing"
      title="TOPIK II Writing — Tasks 51 to 54"
      lede="Writing appears only in TOPIK II. Four tasks, two of them with a strict character band. Here is what each asks."
    >
      <div className="space-y-3">
        {TASKS.map((t) => (
          <div key={t.n} className="rounded-xl border border-almi-line bg-almi-paper p-4">
            <p className="font-semibold text-almi-ink">Task {t.n} <span className="ml-2 text-xs font-medium uppercase tracking-wide text-almi-coral">{t.band}</span></p>
            <p className="mt-1 text-sm text-almi-text">{t.d}</p>
          </div>
        ))}
      </div>
      <h2>The character band is part of the score</h2>
      <p>
        For Tasks 53 (200–300) and 54 (600–700), staying inside the character band matters — going well under or over costs you.
        Our Writing practice shows a <strong>live character counter</strong> against each task&apos;s band as you type, so length
        discipline becomes second nature before test day.
      </p>
      <h2>How Writing is judged — and why our score is an estimate</h2>
      <p>
        Real TOPIK Writing is marked by trained human raters against official criteria: content and task fulfilment, organisation
        and structure, and language use. No automated tool can reproduce that panel exactly. So any score we show is an
        <strong> estimate</strong> that mirrors those criteria transparently — useful for practice, never presented as an official
        result. See{" "}
        <Link href="/topik/how-scoring-works" className="text-almi-coral hover:underline">how Writing fits your total</Link> and{" "}
        <Link href="/practice/topik-ii/writing" className="text-almi-coral hover:underline">practise the Writing tasks</Link>.
      </p>
    </Article>
  );
}
