import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { itemsFor } from "@/lib/items";
import { MockRunner } from "@/components/MockRunner";
import { canonical } from "@/lib/site";
import type { TopikTrack } from "@prisma/client";

const TRACK_MAP: Record<string, TopikTrack> = { "topik-i": "TOPIK_I", "topik-ii": "TOPIK_II" };
const TRACK_LABEL: Record<TopikTrack, string> = { TOPIK_I: "TOPIK I", TOPIK_II: "TOPIK II" };

export function generateStaticParams() {
  return Object.keys(TRACK_MAP).map((track) => ({ track }));
}
export const dynamicParams = false;

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
      <div className="mt-8">
        <MockRunner track={tk} bank={bank} />
      </div>
    </main>
  );
}
