import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { itemsFor } from "@/lib/items";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidAccess, isBillingEnabled } from "@/lib/access";
import { PracticeRunner } from "@/components/PracticeRunner";
import { WritingComposer } from "@/components/WritingComposer";
import { PracticeGate } from "@/components/PracticeGate";
import { canonical } from "@/lib/site";
import type { TopikTrack, TopikSkill } from "@prisma/client";

const TRACK_MAP: Record<string, TopikTrack> = { "topik-i": "TOPIK_I", "topik-ii": "TOPIK_II" };
const SECTION_MAP: Record<string, TopikSkill> = { listening: "LISTENING", reading: "READING", writing: "WRITING" };
const SECTION_LABEL: Record<TopikSkill, string> = { LISTENING: "Listening", READING: "Reading", WRITING: "Writing" };
const TRACK_LABEL: Record<TopikTrack, string> = { TOPIK_I: "TOPIK I", TOPIK_II: "TOPIK II" };

// Valid combos only: TOPIK I = Listening/Reading; TOPIK II = Listening/Writing/Reading.
function isValid(track: TopikTrack, section: TopikSkill): boolean {
  if (section === "WRITING") return track === "TOPIK_II";
  return true;
}

export function generateStaticParams() {
  const combos: { track: string; section: string }[] = [];
  for (const [tSlug, track] of Object.entries(TRACK_MAP))
    for (const [sSlug, section] of Object.entries(SECTION_MAP))
      if (isValid(track, section)) combos.push({ track: tSlug, section: sSlug });
  return combos;
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ track: string; section: string }> }): Promise<Metadata> {
  const { track, section } = await params;
  const tk = TRACK_MAP[track];
  const sec = SECTION_MAP[section];
  if (!tk || !sec || !isValid(tk, sec)) return {};
  return {
    title: `${TRACK_LABEL[tk]} ${SECTION_LABEL[sec]} practice`,
    description: `Practise ${TRACK_LABEL[tk]} ${SECTION_LABEL[sec]} with instant feedback and an honest, total-based read-out. No section floors — every point counts toward your level.`,
    alternates: { canonical: canonical(`/practice/${track}/${section}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ track: string; section: string }> }) {
  const { track, section } = await params;
  const tk = TRACK_MAP[track];
  const sec = SECTION_MAP[section];
  if (!tk || !sec || !isValid(tk, sec)) notFound();
  const items = itemsFor(tk, sec);

  const user = await getCurrentUser();
  const needsPaid = sec === "WRITING"; // AI Writing feedback → paid; Listening/Reading are free
  const paid = hasPaidAccess(user);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">{TRACK_LABEL[tk]} · {SECTION_LABEL[sec]}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Practice set</h1>
      <p className="mt-3 text-almi-text">
        This is a practice read-out, not an official result. TOPIK has no section minimums — everything here counts toward your
        track total, and only NIIED&apos;s official sitting awards a level.
      </p>

      {!user ? (
        <div className="mt-8 rounded-2xl border border-almi-line bg-almi-paper p-6">
          <h2 className="text-lg font-semibold text-almi-ink">Sign in to practise</h2>
          <p className="mt-2 text-sm text-almi-text">Create a free account to practise Listening and Reading free. Writing feedback (TOPIK II) is part of AlmiKorean Pro — a 7-day free trial (card saved, not charged), then $12/month.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex rounded-full bg-almi-coral px-6 py-2.5 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Create free account</Link>
            <Link href="/login" className="inline-flex rounded-full border border-almi-line px-6 py-2.5 font-medium text-almi-ink hover:border-almi-coral">Log in</Link>
          </div>
        </div>
      ) : needsPaid && !paid ? (
        <PracticeGate billingLive={isBillingEnabled()} />
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-almi-line bg-almi-paper p-6 text-almi-text">
          Practice items for this section arrive with Batch 1. The scoring engine and format are already live.
        </div>
      ) : sec === "WRITING" ? (
        <div className="mt-8">
          <WritingComposer items={items} />
        </div>
      ) : (
        <div className="mt-8">
          <PracticeRunner items={items} track={tk} section={sec} />
        </div>
      )}
    </main>
  );
}
