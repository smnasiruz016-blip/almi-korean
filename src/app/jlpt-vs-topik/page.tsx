import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";
// Sister-product cross-link resolved from the SAME sanctioned source the family nav uses
// (@smnasiruz016-blip/almi-data) rather than a hardcoded <a href> — so the almi-japanese
// identity lives in the shared package, not this repo's content. Matched by the bare "japanese"
// key (not the banned slug forms), keeping the fork-hygiene gate clean by construction.
import { FAMILY_PRODUCTS } from "@smnasiruz016-blip/almi-data";

export const metadata: Metadata = {
  title: "JLPT vs TOPIK — two opposite scoring philosophies",
  description:
    "Japan's JLPT and Korea's TOPIK score you in opposite ways: the JLPT fails you if one section dips under a floor; TOPIK decides your level by the total alone. What that means for how you study.",
  alternates: { canonical: canonical("/jlpt-vs-topik") },
};

export default function Page() {
  const jpSibling = FAMILY_PRODUCTS.find((p) => p.key === "japanese");
  return (
    <Article
      eyebrow="Comparison"
      title="JLPT vs TOPIK — two opposite scoring philosophies"
      lede="If you have prepared for Japan's JLPT, unlearn one habit before you sit TOPIK: the two tests score you in opposite ways."
    >
      <p>
        The <strong>JLPT</strong> (Japanese-Language Proficiency Test) uses a <em>dual</em> rule: you need both a total pass mark
        and a minimum in every section. One section under its floor fails the whole test, however high your total. Preparation there
        is defensive — you cannot let any single section collapse.
      </p>
      <p>
        <strong>TOPIK</strong> works the other way. There are no section minimums at all. Your level is decided by the total alone,
        so a strong section fully compensates a weaker one. Preparation here is additive — points anywhere raise the same total,
        and the efficient move is to gain where you have the most room. See{" "}
        <Link href="/topik/how-scoring-works" className="text-almi-coral hover:underline">how TOPIK&apos;s cutoffs work</Link>.
      </p>
      <h2>Side by side</h2>
      <ul className="space-y-2">
        <li>· <strong>Section floors:</strong> JLPT — yes, one below fails you. TOPIK — none.</li>
        <li>· <strong>Level from:</strong> JLPT — total <em>and</em> every section. TOPIK — total only.</li>
        <li>· <strong>Scoring model:</strong> JLPT — scaled (IRT), so an exact simulated score can&apos;t be replicated. TOPIK — Listening/Reading are point-scored directly.</li>
        <li>· <strong>Validity:</strong> JLPT — lifetime. TOPIK — two years.</li>
        <li>· <strong>Levels:</strong> JLPT — N5 (easiest) to N1. TOPIK — 1 (easiest) to 6.</li>
      </ul>
      <p>
        Neither philosophy is &quot;better&quot; — they just reward different study strategies. If you are also preparing for
        Japanese, our sister product{" "}
        <a href={jpSibling?.href} className="text-almi-coral hover:underline">{jpSibling?.name}</a>{" "}
        treats the JLPT&apos;s section-floor rule honestly, the same way we treat TOPIK&apos;s total-only rule here.
      </p>
    </Article>
  );
}
