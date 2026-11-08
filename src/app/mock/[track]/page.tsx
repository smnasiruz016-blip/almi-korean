import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidAccess, needsEmailVerification, isBillingEnabled } from "@/lib/access";
import { hasPracticeAccess } from "@/lib/free-access";
import { itemsFor, toRunnerItem } from "@/lib/items";
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

  // RR-397: paid only. The sequenced mock is never part of the free 48 hours (as AlmiOET's full mock).
  const user = await getCurrentUser();
  const paid = hasPaidAccess(user);

  // A logged-in user inside the free 48 hours sees the honest "part of AlmiKorean Pro" card below; after the 48 hours a
  // non-paid user goes to /account ("Your free 48 hours are over"). Logged-out visitors keep the public sign-in surface
  // below (SEO untouched). Owner/paid pass through.
  if (user && !paid && !hasPracticeAccess(user)) redirect("/account");

  // toRunnerItem strips the answer key before anything reaches the browser; the mock is
  // marked by /api/ko/submit when the run finishes.
  // Every branch goes through toRunnerItem, and the TOPIK_I case is an empty array rather
  // than a conditional spread: a spread into a served object cannot be proved by inspection
  // to exclude the key, which is precisely the hole a key would slip back through.
  // ORDER[TOPIK_I] has no WRITING step, so the empty array is never reached by the runner.
  const bank = {
    LISTENING: itemsFor(tk, "LISTENING").map(toRunnerItem),
    READING: itemsFor(tk, "READING").map(toRunnerItem),
    WRITING: tk === "TOPIK_II" ? itemsFor(tk, "WRITING").map(toRunnerItem) : [],
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
          <p className="mt-2 text-sm text-almi-text">Try free for 48 hours, no card: section practice and one AI-scored Writing. The mock unlocks for $12/month. Cancel anytime.</p>
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
            body="Section practice is open during your free 48 hours (no card). The full sequenced TOPIK mock — combined scoring and a practice level estimate — is part of AlmiKorean Pro: $12 is charged at checkout and then monthly; cancel anytime."
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
