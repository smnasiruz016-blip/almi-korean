import type { Metadata } from "next";
import Link from "next/link";
import { trackCounts } from "@/lib/items";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/access";
import { canonical } from "@/lib/site";
import type { TopikTrack, TopikSkill } from "@prisma/client";

export const metadata: Metadata = {
  title: "Practise TOPIK — choose your track",
  description: "Practise TOPIK I (Listening + Reading) and TOPIK II (Listening + Writing + Reading) with instant auto-marking and honest, total-based level estimates. No section floors.",
  alternates: { canonical: canonical("/practice") },
};

const TRACK_LABEL: Record<TopikTrack, string> = { TOPIK_I: "TOPIK I · Levels 1–2", TOPIK_II: "TOPIK II · Levels 3–6" };
const TRACK_SLUG: Record<TopikTrack, string> = { TOPIK_I: "topik-i", TOPIK_II: "topik-ii" };
const TRACK_SECTIONS: Record<TopikTrack, TopikSkill[]> = {
  TOPIK_I: ["LISTENING", "READING"],
  TOPIK_II: ["LISTENING", "WRITING", "READING"],
};
const SECTION_LABEL: Record<TopikSkill, string> = { LISTENING: "Listening", READING: "Reading", WRITING: "Writing" };
const SECTION_SLUG: Record<TopikSkill, string> = { LISTENING: "listening", READING: "reading", WRITING: "writing" };

export default async function Page() {
  const tracks: TopikTrack[] = ["TOPIK_I", "TOPIK_II"];
  const user = await getCurrentUser();
  const banner = !user
    ? null
    : hasPaidAccess(user)
      ? "AlmiKorean Pro active — Writing feedback included."
      : "Listening and Reading are free. Writing feedback (TOPIK II) is part of Pro — 7-day free trial (card saved, not charged), then $12/month.";
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Practice</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Choose your track</h1>
      <p className="mt-4 text-almi-text">
        Sit either track directly — TOPIK II does not require TOPIK I first. Listening and Reading are auto-marked; Writing uses a
        live character counter against each task&apos;s band. Your level comes from the total, so a strong section carries a weaker one.
      </p>
      {banner && <p className="mt-4 rounded-xl border border-almi-line bg-almi-bg-peach/40 px-4 py-2 text-sm text-almi-text">{banner}</p>}
      <div className="mt-8 space-y-4">
        {tracks.map((tk) => {
          const c = trackCounts(tk);
          return (
            <div key={tk} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
              <p className="font-semibold text-almi-ink">{TRACK_LABEL[tk]}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {TRACK_SECTIONS[tk].map((sec) => (
                  <Link
                    key={sec}
                    href={`/practice/${TRACK_SLUG[tk]}/${SECTION_SLUG[sec]}`}
                    className="rounded-full bg-almi-coral px-4 py-1.5 font-medium text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark"
                  >
                    {SECTION_LABEL[sec]} · {c[sec]}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
