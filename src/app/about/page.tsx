import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "About AlmiKorean",
  description:
    "AlmiKorean is honest TOPIK practice: real task formats for both tracks, total-based level estimates with no section floors, Writing labelled an estimate, 100% original material, and 25% of income pledged to the Shamool Foundation.",
  alternates: { canonical: canonical("/about") },
};

export default function Page() {
  return (
    <Article
      eyebrow="About"
      title="Honest TOPIK practice, by AlmiWorld"
      lede="One rule across every AlmiWorld product: we tell you the truth. For TOPIK, that means your total decides your level — and we never present an estimate as an official score."
    >
      <p>
        AlmiKorean helps you prepare for TOPIK across both tracks: TOPIK I (Listening + Reading, Levels 1–2) and TOPIK II
        (Listening + Writing + Reading, Levels 3–6). You can sit either track directly. TOPIK has no section minimums, so your
        level comes from the total alone — a strong section fully makes up for a weaker one, and we show you where your next
        level&apos;s points come cheapest.
      </p>
      <p>
        Listening and Reading are point-scored directly. TOPIK II Writing is graded by trained human raters on official criteria,
        so we mirror those criteria and label our number an <strong>estimate</strong>, never an official score. Every study item —
        listening dialogue, reading passage and writing prompt — is written from scratch in Korean; nothing is taken from NIIED
        past papers or official materials. Only NIIED&apos;s official sitting awards a level, and a TOPIK certificate is valid for
        two years.
      </p>
      <p>
        <strong>25% of AlmiWorld&apos;s income supports the Shamool Foundation</strong>, a completely free school for children in
        Lahore, Pakistan. Your practice funds real classrooms.
      </p>
    </Article>
  );
}
