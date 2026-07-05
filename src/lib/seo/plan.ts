// AlmiKorean — Wave-1 page plan + sitemap chunking. All math is DERIVED from the real datasets
// (never hardcoded), so exclusions (폐교, branch campuses, grad schools, EPS-only-17) cannot drift.
import { ORIGINS, ORIGIN_COUNT, UNIVERSITIES, LEVELS, EPS_PARTNERS, EPS_SECTORS, DEPARTMENTS } from "@/lib/seo/data";

const N = ORIGIN_COUNT; // 196

// Family page-count math. EPS is DELIBERATELY not ×196 — it exists only for the 17 partner MOUs.
export const FAMILY_COUNTS = {
  university: UNIVERSITIES.length * N, //   Family 1: 384 active main-campus 대학/전문대학 × origins
  department: DEPARTMENTS.length * N, //    Wave 2: 13,477 active department units × origins
  level: LEVELS.length * N, //              Family 2: 6 TOPIK levels × origins
  topikInOrigin: N, //                      Family 3: TOPIK-in-{origin}
  studyRoute: N, //                         Family 4: study-in-korea/{origin}
  eps: EPS_PARTNERS.length + EPS_SECTORS.length + 1, // Family 5: 17 partners + sectors + overview (NEVER ×196)
} as const;

export const WAVE1_TOTAL =
  FAMILY_COUNTS.university +
  FAMILY_COUNTS.level +
  FAMILY_COUNTS.topikInOrigin +
  FAMILY_COUNTS.studyRoute +
  FAMILY_COUNTS.eps;

export const WAVE2_TOTAL = FAMILY_COUNTS.department;
export const GRAND_TOTAL = WAVE1_TOTAL + WAVE2_TOTAL;

// Sitemap chunking (Next 16 generateSitemaps). 40k URLs/chunk stays under Google's 50k cap.
export const CHUNK = 40_000;

// Chunk 0        = statics + core pages + all the small families (level×origin, Family 3, Family 4, EPS).
// Chunks 1..U    = university × origin (Wave 1).
// Chunks U+1..   = department × origin (Wave 2 — the big one).
export const uniChunks = Math.ceil(FAMILY_COUNTS.university / CHUNK);
export const deptChunks = Math.ceil(FAMILY_COUNTS.department / CHUNK);
export const TOTAL_CHUNKS = 1 + uniChunks + deptChunks;

// Slice a (list × origins) cartesian product by global index without materialising it.
export function productSlice<T>(list: T[], lo: number, hi: number, make: (item: T, origin: (typeof ORIGINS)[number]) => string): string[] {
  const end = Math.min(hi, list.length * N);
  const out: string[] = [];
  for (let gi = lo; gi < end; gi++) {
    out.push(make(list[Math.floor(gi / N)], ORIGINS[gi % N]));
  }
  return out;
}
