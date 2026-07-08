import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidAccess, needsEmailVerification, isBillingEnabled } from "@/lib/access";
import { itemsFor } from "@/lib/items";
import { MockRunner } from "@/components/MockRunner";
import { PracticeGate } from "@/components/PracticeGate";
import { EmailVerifyBanner } from "@/components/EmailVerifyBanner";
import { canonical } from "@/lib/site";
import type { TopikTrack } from "@prisma/client";

const TRACK_MAP: Record<string, TopikTrack> = { "topik-i": "TOPIK_I", "topik-ii": "TOPIK_II" };
const TRACK_LABEL: Record<TopikTrack, string> = { TOPIK_I: "TOPIK I", TOPIK_II: "TOPIK II" };

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const { track } = await params;
  const tk = TRACK_MAP[track];
  if (!tk) return {};
  return {
    title: `${TRACK_LABEL[tk]} mock test`,
    description: `Sit a sequenced ${TRACK_LABEL[tk]} mock and get a practice level estimate from your combined total. No section floors — the total decides your level.`,
    alternates: { canonical: canonical(`/mock/${track}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const tk = TRACK_MAP[track];
  if (!tk) notFound();

  // The sequenced mock is a Pro feature (section practice stays free elsewhere).
  const user = await getCurrentUser();
  const paid = hasPaidAccess(user);

  const bank = {
    LISTENING: itemsFor(tk, "LISTENING"),
    READING: itemsFor(tk, "READING"),
    ...(tk === "TOPIK_II" ? { WRITING: itemsFor(tk, "WRITING") } : {}),
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-almi-ink">{TRACK_LABEL[tk]} mock test</h1>
      <p className="mt-3 text-almi-text">
        Work through each section in order. Nothing is marked until you finish — then your total decides your practice level
        estimate. There are no section minimums.
      </p>
      {!user ? (
        <div className="mt-8 rounded-2xl border border-almi-line bg-almi-paper p-6">
          <h2 className="text-lg font-semibold text-almi-ink">The sequenced mock is part of AlmiKorean Pro</h2>
          <p className="mt-2 text-sm text-almi-text">Section practice (Listening and Reading) is free. The full sequenced mock is $12/month — start with a 7-day free trial, card saved but not charged, cancel anytime before it ends.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex rounded-full bg-almi-coral px-6 py-2.5 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Create free account</Link>
            <Link href="/login" className="inline-flex rounded-full border border-almi-line px-6 py-2.5 font-medium text-almi-ink hover:border-almi-coral">Log in</Link>
          </div>
        </div>
      ) : !paid ? (
        needsEmailVerification(user) ? (
          <div className="mt-8"><EmailVerifyBanner email={user.email} /></div>
        ) : (
          <PracticeGate
            billingLive={isBillingEnabled()}
            heading="The sequenced mock is part of AlmiKorean Pro"
            body="Section practice (Listening and Reading) is free. The full sequenced TOPIK mock — combined scoring and a practice level estimate — is $12/month. Start with a 7-day free trial: your card is saved but not charged, and you can cancel anytime before the trial ends and pay nothing."
          />
        )
      ) : (
        <div className="mt-8">
          <MockRunner track={tk} bank={bank} />
        </div>
      )}
    </main>
  );
}
