import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "TOPIK vs EPS-TOPIK — which one do you need?",
  description:
    "TOPIK and EPS-TOPIK are two different Korean tests run by two different bodies for two different purposes. Here is the honest distinction, so you sit the right one.",
  alternates: { canonical: canonical("/topik-vs-eps-topik") },
};

export default function Page() {
  return (
    <Article
      eyebrow="Which test"
      title="TOPIK vs EPS-TOPIK — which one do you need?"
      lede="They share three letters and nothing else. Sitting the wrong one wastes months, so here is the plain distinction."
    >
      <p>
        <strong>Standard TOPIK</strong> (Test of Proficiency in Korean) is run by NIIED, part of Korea&apos;s Ministry of
        Education. It measures general Korean proficiency and awards Levels 1–6. It is what universities, points-based visas and
        many professional routes reference. This site — AlmiKorean — prepares you for standard TOPIK.
      </p>
      <p>
        <strong>EPS-TOPIK</strong> is a different test, run by <strong>HRD Korea</strong> under the Ministry of Employment and
        Labor, for the <strong>Employment Permit System (EPS)</strong> — the route non-professional workers use to reach an E-9
        work visa. It has its own format, its own body, and its own purpose. Passing standard TOPIK is <em>not</em> the EPS gate,
        and passing EPS-TOPIK does not give you a standard TOPIK level.
      </p>
      <h2>Side by side</h2>
      <ul className="space-y-2">
        <li>· <strong>Purpose:</strong> TOPIK — study, points visas, professional routes. EPS-TOPIK — eligibility for E-9 employment.</li>
        <li>· <strong>Run by:</strong> TOPIK — NIIED (Education). EPS-TOPIK — HRD Korea (Employment &amp; Labor).</li>
        <li>· <strong>Result:</strong> TOPIK — a level (1–6), valid two years. EPS-TOPIK — a ranked result feeding a country-sector job pool.</li>
        <li>· <strong>Who it&apos;s for:</strong> TOPIK — most learners. EPS-TOPIK — applicants from the EPS partner countries pursuing E-9 work.</li>
      </ul>
      <p>
        A pass on EPS-TOPIK does not by itself mean selection: it enters you into a ranked pool, and employers plus quotas decide.
        Requirement is not the same as a guarantee. If your goal is E-9 employment, prepare for EPS-TOPIK through your country&apos;s
        designated government agency — not this site.
      </p>
      <p>
        If your goal is a Korean university place, a points-based visa, permanent residence points or a professional role, standard
        TOPIK is the test — and that is what we help you practise. See{" "}
        <Link href="/eps" className="text-almi-coral hover:underline">how the EPS work ladder relates to standard TOPIK</Link>{" "}
        as workers move up, and{" "}
        <Link href="/topik/levels" className="text-almi-coral hover:underline">what each TOPIK level means</Link>.
      </p>
    </Article>
  );
}
