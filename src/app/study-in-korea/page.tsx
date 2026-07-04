import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Studying in Korea — what TOPIK level you actually need",
  description:
    "Korean-taught degrees commonly ask for TOPIK 3–4, but the requirement is set per institution, not nationally. English-taught programmes often need no TOPIK. An honest guide, with no invented lists.",
  alternates: { canonical: canonical("/study-in-korea") },
};

export default function Page() {
  return (
    <Article
      eyebrow="Study route"
      title="Studying in Korea — what TOPIK level you actually need"
      lede="The short answer: it depends on the institution and the programme. Here is how to find your real requirement without guesswork."
    >
      <p>
        For Korean-taught degree programmes, a TOPIK level of <strong>3–4</strong> is a common admission requirement, and some
        programmes ask for a higher level to graduate. But this is set <strong>per institution and per programme</strong> — there
        is no single national threshold. Always confirm the figure on the specific university&apos;s own admissions page.
      </p>
      <p>
        <strong>English-taught programmes</strong> often require no TOPIK at all, asking instead for an English test. If you plan
        to study fully in English, a TOPIK level may not be needed for admission — though it still helps with daily life and later
        work in Korea. Check each programme&apos;s language of instruction.
      </p>
      <h2>Scholarships</h2>
      <p>
        Korea runs the Global Korea Scholarship (GKS), and holding a TOPIK level can carry advantages in some tracks. The exact
        terms, eligibility and any level benefits change year to year, so rely on the official GKS material (Study in Korea /
        NIIED) rather than second-hand summaries — we do not restate scholarship criteria here.
      </p>
      <h2>Time your test</h2>
      <p>
        A TOPIK certificate is valid for two years, so sit it close enough to your application that the result is still valid when
        it is assessed. See{" "}
        <Link href="/topik/validity" className="text-almi-coral hover:underline">validity and timing</Link>,{" "}
        <Link href="/topik/levels" className="text-almi-coral hover:underline">what each level means</Link>, and{" "}
        <Link href="/practice" className="text-almi-coral hover:underline">practise the track you need</Link>.
      </p>
      <p className="text-sm text-almi-text-muted">
        A requirement is not a guarantee of admission, and a test is not a visa. Institutions set their own rules; confirm every
        figure at the source before you rely on it.
      </p>
    </Article>
  );
}
