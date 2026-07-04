// AlmiKorean — app-side item loader (bundled Batch-1 bank). Used for Wave-1 practice before
// the Neon DB is provisioned; the same bank seeds the DB later (Phase-2 seed pipeline).
// Items are bucketed by {track × section}, never by output level (levels are computed by the engine).
import bank from "@/data/items-batch1.json";
import type { TopikTrack, TopikSkill } from "@prisma/client";

export type Option = { id: string; text: string };
export type Question = { id: string; stem: string; options: Option[]; answer: string };
export type WritingSpec = { taskNumber: number; prompt: string; charMin?: number; charMax?: number; guidance?: string };
export type ItemPayload = {
  passages?: { id: string; body: string }[]; //  READING
  audioScript?: string; //                        LISTENING
  speakers?: { role: string; voice: string }[]; // LISTENING
  questions?: Question[]; //                       LISTENING / READING (objective)
  writing?: WritingSpec; //                        WRITING (Tasks 51–54)
};
export type BankItem = {
  track: TopikTrack;
  section: TopikSkill;
  taskType: string;
  difficulty: string;
  title: string;
  topicTag?: string;
  guidanceNote?: string;
  payload: ItemPayload;
};

export const BANK = bank as unknown as BankItem[];

export function itemsFor(track: TopikTrack, section: TopikSkill): BankItem[] {
  return BANK.filter((i) => i.track === track && i.section === section);
}

/** Counts per section within a track (used by /practice pickers + /api/status). */
export function trackCounts(track: TopikTrack): Record<TopikSkill, number> {
  return {
    LISTENING: itemsFor(track, "LISTENING").length,
    READING: itemsFor(track, "READING").length,
    WRITING: itemsFor(track, "WRITING").length,
  };
}
