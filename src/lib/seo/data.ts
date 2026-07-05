// AlmiKorean — Phase-3 SEO data layer. Loads the Phase-0 parsed datasets (real data only)
// and exposes the indexable splits that drive page generation. Every count is DERIVED from the
// data (never a hardcoded literal), so exclusions (폐교, branch campuses, grad schools) can't drift.
import originsData from "@/data/origins.json";
import uniData from "@/data/kr-universities.json";
import deptData from "@/data/kr-departments-wave2.json";
import epsPartnerData from "@/data/eps-partners.json";
import epsSectorData from "@/data/eps-sectors.json";

export type Origin = {
  slug: string;
  name: string;
  iso2: string;
  region: string;
  lang: string | null;
  langLabel: string | null;
};

// One institution page per ACTIVE main-campus 대학/전문대학. Fields are published ONLY from
// A2 (교육편제단위, licence 제한 없음) + Wikidata (CC0). A1 (학교개황) was used to derive the
// active/폐교 filter but its fields (establishment/website/address/founding date) are NOT
// published until its licence line is confirmed — hence they are absent here by design.
export type University = {
  slug: string;
  nameKo: string; //          official Korean name (A2 학교명) — primary
  nameEn: string; //          Wikidata English label, or flagged romanization
  nameEnGenerated: boolean; // true = machine romanization, not an official English name
  type: "University" | "Junior college";
  cls: "대학" | "전문대학";
  region: string; //          A2 (대학)지역
  lat: number | null; //      Wikidata coordinates (CC0), else null
  lng: number | null;
  code: string; //            학교코드 (identifier, not displayed)
  campus: string; //          A2 본분교 — always "본교"; branch records (제2/3/4캠퍼스·분교) are excluded at ingest
};

// Wave-2 department unit: one page per {institution, department}, day/night merged. All fields from
// A2 (교육편제단위, licence 제한 없음). Grad-school depts + closed depts + the 41 grad-level/ambiguous
// units excluded at ingest. The dataset does NOT carry language of instruction — pages never claim it.
export type Department = {
  uniSlug: string; //     links to the Wave-1 institution
  uniCode: string;
  nameKo: string; //      department/major name (hangul, primary)
  nameEn: string; //      romanized display (always generated — flagged on-page)
  slug: string; //        unique within the institution
  college: string; //     단과대학명 grouping
  series: string[]; //    대/중/소계열 classification
  degree: string; //      학위과정 (전문학사 / 학사 / …)
  years: string; //       수업연한
  dayNight: string[]; //  merged 주야간구분 divisions
  location: string; //    (학과)소재지
  characteristic: string; // 학과특성 (raw)
  charClass: "regular" | "contract" | "industry-commissioned" | "degree-completion" | "special";
};

export type EpsPartner = { slug: string; name: string; iso2: string; mou: boolean; newest?: boolean };
export type EpsSector = { slug: string; name: string; nameKo: string };

// The 17 EPS-TOPIK partner countries (Tier-1 corridors). EPS pages exist ONLY for these — never
// ×196 — because EPS is a bilateral MOU programme; a "EPS from Germany" page would be fabrication.
export const EPS_ISO2 = new Set((epsPartnerData as EpsPartner[]).map((p) => p.iso2));

export const ORIGINS = (originsData as Origin[]).slice().sort((a, b) => a.slug.localeCompare(b.slug));
export const ORIGIN_COUNT = ORIGINS.length; // 196
// Tier-1 = the origin is an EPS partner country: deepest corridor localization.
export const isEpsOrigin = (o: Origin) => EPS_ISO2.has(o.iso2);

export const UNIVERSITIES = (uniData as University[]).slice().sort((a, b) => a.slug.localeCompare(b.slug));

export const EPS_PARTNERS = (epsPartnerData as EpsPartner[]).slice();
export const EPS_SECTORS = (epsSectorData as EpsSector[]).slice();

// TOPIK levels 1–6, each mapped to its track + verified pass cutoff (from the scoring specs).
// NO sectional minimums — level = total alone (the anti-JLPT rule, surfaced on every level page).
export const LEVELS = [
  { level: 1, track: "TOPIK_I" as const, trackLabel: "TOPIK I", cutoff: 80, totalMax: 200 },
  { level: 2, track: "TOPIK_I" as const, trackLabel: "TOPIK I", cutoff: 140, totalMax: 200 },
  { level: 3, track: "TOPIK_II" as const, trackLabel: "TOPIK II", cutoff: 120, totalMax: 300 },
  { level: 4, track: "TOPIK_II" as const, trackLabel: "TOPIK II", cutoff: 150, totalMax: 300 },
  { level: 5, track: "TOPIK_II" as const, trackLabel: "TOPIK II", cutoff: 190, totalMax: 300 },
  { level: 6, track: "TOPIK_II" as const, trackLabel: "TOPIK II", cutoff: 230, totalMax: 300 },
] as const;
export type LevelInfo = (typeof LEVELS)[number];

// Wave-2 departments (13,477 units). Grouped by institution for the uni-page index + O(1) lookup.
export const DEPARTMENTS = (deptData as Department[]);
export const DEPTS_BY_UNI = new Map<string, Department[]>();
for (const d of DEPARTMENTS) {
  const arr = DEPTS_BY_UNI.get(d.uniSlug);
  if (arr) arr.push(d);
  else DEPTS_BY_UNI.set(d.uniSlug, [d]);
}
export const BY_DEPT = new Map(DEPARTMENTS.map((d) => [`${d.uniSlug}/${d.slug}`, d]));

export const BY_ORIGIN = new Map(ORIGINS.map((o) => [o.slug, o]));
export const BY_UNI = new Map(UNIVERSITIES.map((u) => [u.slug, u]));
export const BY_EPS = new Map(EPS_PARTNERS.map((p) => [p.slug, p]));
export const BY_SECTOR = new Map(EPS_SECTORS.map((s) => [s.slug, s]));
export const BY_LEVEL = new Map(LEVELS.map((l) => [String(l.level), l]));
