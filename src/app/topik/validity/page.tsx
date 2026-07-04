import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "TOPIK validity — your certificate lasts two years",
  description:
    "A TOPIK certificate is valid for two years from the results announcement. Why that window matters, and how to time your test against an application deadline.",
  alternates: { canonical: canonical("/topik/validity") },
};

export default function Page() {
  return (
    <Article
      eyebrow="Validity"
      title="TOPIK validity: two years, and why timing matters"
      lede="Unlike some language certificates that last a lifetime, a TOPIK result has a two-year shelf life. Plan around it."
    >
      <p>
        A TOPIK certificate is <strong>valid for two years</strong> from the date results are announced. After that, an
        institution or immigration office may no longer accept it, and you would need to sit again. This is different from the JLPT
        (lifetime) and from some other exams — each test has its own rule, and TOPIK&apos;s is two years.
      </p>
      <h2>Why the window matters</h2>
      <p>
        Because the certificate expires, an early result can lapse before you need it. If your university application, visa filing
        or points assessment lands in, say, eighteen months, a test you sit too early risks falling outside the two-year window by
        the time it is assessed. Work backward from your deadline.
      </p>
      <ul className="space-y-2">
        <li>· Find the date your result must still be valid (the application or filing date).</li>
        <li>· Remember results are announced roughly a month after the test.</li>
        <li>· Choose a sitting whose result stays valid through that date — not so early that it lapses.</li>
      </ul>
      <p>
        More than one valid certificate can coexist, and sitting again does not cancel an earlier result — so a retake to refresh
        the two-year window is straightforward. See{" "}
        <Link href="/topik/test-dates" className="text-almi-coral hover:underline">the sitting calendar</Link> to plan, and{" "}
        <Link href="/topik/levels" className="text-almi-coral hover:underline">what each level means</Link> for the target you need.
      </p>
    </Article>
  );
}
