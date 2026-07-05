// AlmiKorean — ops/health endpoint for AlmiMonitor (built from day one, like CELPIP/TOEFL).
// Counts only, no PII. Two independent signals:
//   * itemBank      — the bundled Batch-1 bank (source of truth BEFORE Neon is provisioned).
//   * dbItemsActive — live KoreanItem row count; null until the DB exists / seed lands (opportunistic).
//   * seoPages      — Phase-3 Wave-1 page-family totals, derived from the same real data the sitemap uses.

import { NextResponse } from "next/server";
import { BANK } from "@/lib/items";
import { TRACKS } from "@/lib/topik/scoring";
import { FAMILY_COUNTS, WAVE1_TOTAL, WAVE2_TOTAL, GRAND_TOTAL } from "@/lib/seo/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  // Bundled bank breakdown by {track × section} (works with zero infrastructure).
  const byBucket: Record<string, number> = {};
  for (const t of TRACKS) for (const s of ["LISTENING", "READING", "WRITING"]) byBucket[`${t}:${s}`] = 0;
  for (const it of BANK) byBucket[`${it.track}:${it.section}`] = (byBucket[`${it.track}:${it.section}`] ?? 0) + 1;

  // Live DB count is best-effort: import lazily so a missing DATABASE_URL never 500s the health check.
  let dbItemsActive: number | null = null;
  let dbError: string | null = null;
  try {
    const { prisma } = await import("@/lib/prisma");
    dbItemsActive = await prisma.koreanItem.count();
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db unreachable";
  }

  return NextResponse.json(
    {
      ok: true,
      product: "AlmiKorean",
      itemBank: { total: BANK.length, byBucket },
      dbItemsActive, // null until Neon is provisioned + the seed has run
      dbError,
      // Phase-3 SEO surface — derived from the same real datasets the sitemap uses.
      seoPages: { total: GRAND_TOTAL, wave1: WAVE1_TOTAL, wave2: WAVE2_TOTAL, families: FAMILY_COUNTS },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
