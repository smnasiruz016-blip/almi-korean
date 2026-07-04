import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Korea's EPS work route and how Korean ability fits the ladder",
  description:
    "An honest overview of Korea's Employment Permit System (EPS): the E-9 route, why passing the test is not selection, the 2026 quota reality, and how Korean proficiency counts more as workers move up the visa ladder.",
  alternates: { canonical: canonical("/eps") },
};

export default function Page() {
  return (
    <Article
      eyebrow="Work route"
      title="Korea's EPS work route — and where Korean ability fits"
      lede="A plain-language map of the Employment Permit System, with the honest caveats most guides leave out."
    >
      <p>
        The <strong>Employment Permit System (EPS)</strong> is how Korea admits non-professional workers on an <strong>E-9</strong>
        visa. It runs government-to-government with a set of partner countries and is administered by the Ministry of Employment and
        Labor with HRD Korea. Eligibility runs through <strong>EPS-TOPIK</strong> — a different test from standard TOPIK. If your
        aim is E-9 work, read{" "}
        <Link href="/topik-vs-eps-topik" className="text-almi-coral hover:underline">TOPIK vs EPS-TOPIK</Link> first.
      </p>
      <h2>Three honest caveats</h2>
      <ul className="space-y-2">
        <li>
          · <strong>A pass is not selection.</strong> EPS-TOPIK enters you into a ranked pool within your country-and-sector quota;
          employers and quotas then decide. Meeting the requirement is not a guarantee of a job.
        </li>
        <li>
          · <strong>The quota is tightening.</strong> The 2026 E-9 quota was reported at around 80,000 — down roughly 38% from
          130,000 in 2025 (Ministry of Employment and Labor figures, as reported; confirm the current number on the official
          sources below). Fewer places means language scores weigh more, not less.
        </li>
        <li>
          · <strong>No broker fees.</strong> Sending happens only through each partner country&apos;s designated government agency.
          Placement or broker fees are not part of the system&apos;s design — treat anyone charging them as a warning sign.
        </li>
      </ul>
      <p className="text-sm text-almi-text-muted">
        The list of EPS partner countries is set by official government-to-government agreements and changes as new ones are signed
        (Tajikistan was a recent addition). For the current partner list and quota, use the official sources — we do not restate a
        fixed count here.
      </p>
      <h2>The ladder — where standard TOPIK grows in weight</h2>
      <p>
        Standard TOPIK matters more the further a worker climbs. In broad terms the path runs from E-9 (EPS) toward a
        skilled-worker conversion (E-7-4), then points-based residence (F-2), and eventually permanent residence (F-5). Korean
        ability counts along the way — but the exact point values and level requirements at each rung come only from official
        immigration sources, so we describe the ladder without inventing numbers. Confirm requirements at HiKorea / the Ministry of
        Justice before relying on any figure.
      </p>
      <p>
        A test is not a visa, and a requirement is not a guarantee. As you move up that ladder, standard TOPIK levels are what
        count — and that is what we help you practise. See{" "}
        <Link href="/study-in-korea" className="text-almi-coral hover:underline">the study route</Link> for the other main path
        Korean proficiency opens.
      </p>
    </Article>
  );
}
