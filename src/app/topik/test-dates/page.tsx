import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "TOPIK test dates and sittings — how the calendar works",
  description:
    "How TOPIK sittings work: several rounds a year inside Korea, fewer overseas and varying by country, results about a month later. Plus how the computer-based TOPIK IBT differs. Always confirm on the official site.",
  alternates: { canonical: canonical("/topik/test-dates") },
};

export default function Page() {
  return (
    <Article
      eyebrow="Test dates"
      title="TOPIK sittings — how the calendar works"
      lede="How often TOPIK runs, why the overseas calendar differs from Korea's, and where to confirm your exact date."
    >
      <p>
        Inside Korea, the paper-based TOPIK runs <strong>six times a year</strong> (rounds in January, April, May, July, October
        and November). <strong>Overseas the calendar is smaller</strong> — typically two to four sittings a year — and it varies by
        country and by test centre. Not every round is offered everywhere, and some countries run only one or two of the year&apos;s
        sittings.
      </p>
      <p>
        Results are announced roughly a month after the test. Because a certificate is valid for two years, line your sitting up
        with your deadline — see{" "}
        <Link href="/topik/validity" className="text-almi-coral hover:underline">validity and timing</Link>.
      </p>
      <h2>Find your exact date and centre</h2>
      <p>
        The authoritative calendar, the list of test centres in each country, and the current fees all live on the official site,
        <strong> topik.go.kr</strong>, and they change from year to year. Fees also differ by country. We do not reprint dates,
        centre lists or fee amounts here, because a stale number is worse than none — check the official site for your country.
      </p>
      <h2>Paper-based TOPIK vs TOPIK IBT</h2>
      <p>
        There is also a computer-based version, <strong>TOPIK IBT</strong>, which runs on its own separate calendar. It is not the
        same as the paper sittings above and its dates should never be read as interchangeable with them. If you are considering
        the IBT, confirm its current availability and schedule separately on the official site.
      </p>
      <p>
        Ready to prepare? <Link href="/practice" className="text-almi-coral hover:underline">Choose your track and practise</Link>.
      </p>
    </Article>
  );
}
