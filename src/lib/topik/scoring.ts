// AlmiKorean — TOPIK scoring engine.
// LAW: AlmiKorean_Verified_Scoring_Specs_CC.md §1–§5. Every rule here is verified.
//
// The engine is deliberately the MIRROR-OPPOSITE of the JLPT engine we forked from:
//  1. TOPIK has NO sectional minimums. The level comes from the TOTAL alone — a strong
//     section fully compensates a weak one. There are NO floors, NO CLEAR/BORDERLINE states,
//     and NO "one section under = fail" rule. (specs §3)
//  2. Listening/Reading are point-based MCQ sections → we report DIRECT raw scores /100
//     (legitimate; no IRT scaling mystery). Writing (TOPIK II) is an AI criteria-based
//     ESTIMATE, never an official score, flagged isEstimate on every readout. (specs §5)
//  3. Below the lowest cutoff there is NO level and NO "fail" grade — we say "no level yet",
//     NEVER "failed". (specs §2, §9)
//  4. Verdict = highest level whose cutoff <= total (else "no level yet"). Only NIIED's
//     official sitting awards a real level; everything here is a practice estimate.

export type TopikTrack = "TOPIK_I" | "TOPIK_II";
export type TopikSection = "LISTENING" | "READING" | "WRITING";
export type TopikLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface SectionSpec {
  section: TopikSection;
  label: string;
  scaleMax: number; //     each section is scored 0–100
  isEstimate: boolean; //  true = AI criteria estimate (Writing), not a point-counted raw score
}

export interface Cutoff {
  level: TopikLevel;
  min: number; //  minimum TOTAL for this level (inclusive). NOTE: total-only. No section floor.
}

export interface TrackConfig {
  track: TopikTrack;
  label: string;
  sections: SectionSpec[];
  totalMax: number;
  cutoffs: Cutoff[]; //  ascending by min
  timedBlocks: string[]; // mock structure mirror (real exam slot order)
}

const SEC_LISTENING: SectionSpec = { section: "LISTENING", label: "Listening", scaleMax: 100, isEstimate: false };
const SEC_READING: SectionSpec = { section: "READING", label: "Reading", scaleMax: 100, isEstimate: false };
// Writing is graded by trained human raters on official criteria; our score is an AI estimate.
const SEC_WRITING: SectionSpec = { section: "WRITING", label: "Writing (AI estimate)", scaleMax: 100, isEstimate: true };

// VERIFIED structure + cutoffs (specs §1–§2). Do not change. NO sectional minimums exist.
export const TOPIK_CONFIG: Record<TopikTrack, TrackConfig> = {
  TOPIK_I: {
    track: "TOPIK_I",
    label: "TOPIK I (levels 1–2)",
    sections: [SEC_LISTENING, SEC_READING],
    totalMax: 200,
    cutoffs: [
      { level: 1, min: 80 },
      { level: 2, min: 140 },
    ],
    timedBlocks: ["Listening (30 questions)", "Reading (40 questions)"],
  },
  TOPIK_II: {
    track: "TOPIK_II",
    label: "TOPIK II (levels 3–6)",
    sections: [SEC_LISTENING, SEC_WRITING, SEC_READING],
    totalMax: 300,
    cutoffs: [
      { level: 3, min: 120 },
      { level: 4, min: 150 },
      { level: 5, min: 190 },
      { level: 6, min: 230 },
    ],
    // Real exam runs two slots: (Listening + Writing) then (Reading).
    timedBlocks: ["Listening (50 questions) + Writing (4 tasks)", "Reading (50 questions)"],
  },
};

export const TRACKS: readonly TopikTrack[] = ["TOPIK_I", "TOPIK_II"];

export interface SectionInput {
  section: TopikSection;
  score: number; //  0..100 (raw for L/R; AI estimate for Writing)
}

export interface SectionResult {
  section: TopikSection;
  label: string;
  score: number; //          0..scaleMax
  scaleMax: number;
  percentOfTotal: number; //  this section's share of the total earned (0–100), for the readout
  headroom: number; //        scaleMax - score: unearned points still available here
  isEstimate: boolean; //     Writing = true (AI estimate label on every readout)
}

export interface TopikResult {
  track: TopikTrack;
  sections: SectionResult[];
  total: number;
  totalMax: number;
  level: TopikLevel | null; //  awarded practice level (null = no level yet — NEVER "failed")
  levelLabel: string; //        e.g. "Level 4 (practice estimate)" or "No level yet (practice)"
  nextCutoff: { level: TopikLevel; min: number; pointsToNext: number } | null;
  cheapestGainSection: TopikSection | null; // largest headroom → "points are cheapest here for YOU"
  incomplete: boolean; //       a required section missing/empty
  isEstimate: true; //          compile-time reminder: this is a practice estimate, never official
  honestyLine: string;
}

function clampScore(n: number, max: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n > max ? max : n;
}

/** Highest level whose cutoff min <= total; null if below the lowest cutoff. */
function verdictLevel(cfg: TrackConfig, total: number): TopikLevel | null {
  let awarded: TopikLevel | null = null;
  for (const c of cfg.cutoffs) {
    if (total >= c.min) awarded = c.level;
  }
  return awarded;
}

/** The next cutoff strictly above the current total (for "points to next level"). */
function nextCutoff(cfg: TrackConfig, total: number): { level: TopikLevel; min: number; pointsToNext: number } | null {
  for (const c of cfg.cutoffs) {
    if (total < c.min) return { level: c.level, min: c.min, pointsToNext: c.min - total };
  }
  return null; // already at/above the top cutoff
}

/**
 * Compute a TOPIK practice read-out from per-section scores.
 * NO sectional minimums are applied anywhere. Level is decided by the TOTAL alone.
 * Never returns an official score and never uses the word "failed".
 */
export function scoreTopik(track: TopikTrack, inputs: SectionInput[]): TopikResult {
  const cfg = TOPIK_CONFIG[track];
  const bySection = new Map(inputs.map((i) => [i.section, i]));

  let incomplete = false;
  let total = 0;

  const raw = cfg.sections.map((spec) => {
    const input = bySection.get(spec.section);
    if (!input || !Number.isFinite(input.score)) incomplete = true;
    const score = clampScore(input?.score ?? 0, spec.scaleMax);
    total += score;
    return { spec, score };
  });

  const sections: SectionResult[] = raw.map(({ spec, score }) => ({
    section: spec.section,
    label: spec.label,
    score,
    scaleMax: spec.scaleMax,
    percentOfTotal: total > 0 ? Math.round((score / total) * 1000) / 10 : 0,
    headroom: spec.scaleMax - score,
    isEstimate: spec.isEstimate,
  }));

  const level = verdictLevel(cfg, total);
  const next = nextCutoff(cfg, total);

  // "Where are points cheapest for YOU": the section with the most unearned points (largest
  // headroom). Because there are no floors, gaining anywhere raises the total equally — so we
  // simply point at the section with the most room to grow. Compensation guidance, not a floor.
  let cheapest: TopikSection | null = null;
  let maxHeadroom = -1;
  for (const s of sections) {
    if (s.headroom > maxHeadroom) { maxHeadroom = s.headroom; cheapest = s.section; }
  }

  const levelLabel = level === null ? "No level yet (practice)" : `Level ${level} (practice estimate)`;

  return {
    track,
    sections,
    total,
    totalMax: cfg.totalMax,
    level,
    levelLabel,
    nextCutoff: next,
    cheapestGainSection: cheapest,
    incomplete,
    isEstimate: true,
    honestyLine:
      `This is a practice estimate, not an official result. TOPIK has no section minimums — your ` +
      `level comes from the total alone, so a strong section makes up for a weaker one. Only NIIED's ` +
      `official sitting awards a level.`,
  };
}
