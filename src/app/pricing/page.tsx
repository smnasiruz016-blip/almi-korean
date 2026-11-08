import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing — AlmiKorean",
  description:
    "Simple, honest pricing: try free for 48 hours, then $12/month. Cancel anytime. Both TOPIK tracks, full practice and mock access, and 100% original material.",
  alternates: { canonical: canonical("/pricing") },
};

const INCLUDED = [
  "Both tracks (TOPIK I and II), full practice and mock access",
  "Total-based level estimates with per-section contribution",
  "Writing composer with live character counter + criteria feedback (labelled estimate)",
  "Timing matched to the real per-section limits",
  "100% original material — flat monthly price, cancel in one click",
];

export default function Page() {
  return (
    <Article
      eyebrow="Pricing"
      title="Simple, honest pricing"
      lede="Try free for 48 hours, then $12/month. Cancel anytime."
    >
      <ul className="space-y-2">
        {INCLUDED.map((li) => (
          <li key={li} className="flex gap-2"><span className="text-almi-teal">✓</span>{li}</li>
        ))}
      </ul>
      <Link href="/signup" className="inline-flex rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
        Try free for 48 hours
      </Link>
      <p className="text-sm text-almi-text-muted">
        Billing is handled securely at checkout. Prices shown in USD; your bank may convert to your local currency.
      </p>
    </Article>
  );
}
