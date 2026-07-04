import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";
import { TOPIK_CONFIG } from "@/lib/topik/scoring";

export const metadata: Metadata = {
  title: "How TOPIK scoring works — your total decides your level",
  description:
    "TOPIK has no section minimums. Your level comes from the total alone, so a strong section makes up for a weaker one. Here is exactly how the cutoffs work, and why Writing is an estimate.",
  alternates: { canonical: canonical("/topik/how-scoring-works") },
};

const I = TOPIK_CONFIG.TOPIK_I;
const II = TOPIK_CONFIG.TOPIK_II;

export default function Page() {
  return (
    <Article
      eyebrow="Scoring"
      title="How TOPIK scoring works"
      lede="One number decides everything: your total. There are no hidden section floors, so a strong section carries a weaker one."
    >
      <p>
        Each TOPIK section is scored out of 100. Your level is the highest one whose cutoff your <strong>total</strong> reaches.
        There is no per-section minimum — nothing in one section can fail you if your total is high enough. This is the opposite of
        some other language tests, and it is the single most important thing to understand about TOPIK.
      </p>
      <h2>The cutoffs</h2>
      <p><strong>TOPIK I</strong> (Listening + Reading, out of {I.totalMax}):</p>
      <ul className="space-y-1">
        {I.cutoffs.map((c) => (
          <li key={c.level}>· Level {c.level}: total of {c.min}+</li>
        ))}
      </ul>
      <p><strong>TOPIK II</strong> (Listening + Writing + Reading, out of {II.totalMax}):</p>
      <ul className="space-y-1">
        {II.cutoffs.map((c) => (
          <li key={c.level}>· Level {c.level}: total of {c.min}+</li>
        ))}
      </ul>
      <p>
        Below the lowest cutoff, no level is awarded. There is no &quot;fail&quot; grade in TOPIK, and no certificate is issued —
        we say &quot;no level yet&quot;, never &quot;failed&quot;.
      </p>
      <h2>Why this changes how you prepare</h2>
      <p>
        Because points anywhere raise the same total, the smartest preparation puts effort where you have the most room to gain.
        If your reading is strong and your listening lags, the points you add in listening count exactly as much toward your level.
        Our practice read-outs show each section&apos;s contribution to your total and point you to where your next level&apos;s
        points come cheapest for you.
      </p>
      <h2>Listening and Reading vs Writing</h2>
      <p>
        Listening and Reading are point-scored directly from correct answers, so a raw practice score is honest. TOPIK II Writing
        is graded by trained human raters against official criteria (content, structure, language use). We mirror those criteria
        and label our Writing number an <strong>estimate</strong>, every time — never an official score. Only NIIED&apos;s official
        sitting awards a real level.
      </p>
      <p>
        See also{" "}
        <Link href="/topik/levels" className="text-almi-coral hover:underline">what each level means</Link>,{" "}
        <Link href="/jlpt-vs-topik" className="text-almi-coral hover:underline">how TOPIK&apos;s no-floor rule differs from the JLPT</Link>, and{" "}
        <Link href="/topik/writing-guide" className="text-almi-coral hover:underline">the Writing tasks in detail</Link>.
      </p>
    </Article>
  );
}
