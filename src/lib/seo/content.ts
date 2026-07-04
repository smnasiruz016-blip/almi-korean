// AlmiKorean — shared honest-content helpers for SEO pages. Every corridor page draws its framing
// from here so no page is a country-name find-replace, and the doctrine lines (2-year validity,
// requirement-not-guarantee, attribution, Shamool) are identical everywhere.
import type { Origin } from "@/lib/seo/data";
export { SITE, canonical, SHAMOOL_LINE } from "@/lib/site";

// Attribution reflects what we actually PUBLISH: institution identity from 교육편제단위 (A2,
// licence 이용허락범위 "제한 없음") + English names/coordinates from Wikidata (CC0). We do NOT
// republish 학교개황 (A1) fields, so it is not credited as a published source. Ref date 2024-10-07.
export const KCUE_ATTRIBUTION =
  "Institution list: KCUE University Information Disclosure — 교육편제단위 dataset (data.go.kr, licence 제한 없음; data ref. 2024-10-07). English names & coordinates: Wikidata (CC0). Processed/edited by AlmiWorld, not presented as issued by the Government of the Republic of Korea.";

// The 2-year validity line (specs) — TOPIK results expire, unlike JLPT. Appears wherever timing matters.
export const VALIDITY_LINE =
  "A TOPIK result is valid for 2 years from the results date — plan your test so it is still valid when you apply.";

// Requirement-not-guarantee doctrine — a score is never a visa, a place, or a job.
export const REQ_NOT_GUARANTEE =
  "A TOPIK level is a requirement some universities and routes ask for — never a visa, an admission, or a job offer on its own.";

// Honest native-language mention (uses the origin's real search language label, never a country swap).
export function nativeLead(o: Origin): string {
  const lang = o.langLabel ? `${o.langLabel}-speaking learners in ` : "learners in ";
  return `For ${lang}${o.name}, this page keeps the TOPIK facts local and honest — the two separate tests, the real level cutoffs, and the real corridor rules, with no invented thresholds.`;
}

// The no-floors compensation line — the #1 anti-JLPT differentiator, stated identically everywhere.
export const NO_FLOORS_LINE =
  "TOPIK has no section minimums: your level is decided by your TOTAL alone, so a strong section can carry a weaker one. We never import JLPT-style sectional floors.";
