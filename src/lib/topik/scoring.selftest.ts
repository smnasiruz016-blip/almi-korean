// Self-test for the TOPIK engine vs the LAW specs. Run: npm run selftest:engine
// These assertions encode the MIRROR-OPPOSITE-of-JLPT rules: no floors, total-only levels,
// compensation allowed, never the word "failed", Writing = estimate.
import { TOPIK_CONFIG, scoreTopik, TopikResult } from "./scoring";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log("  ✓", name); }
  else { fail++; console.log("  ✗ FAIL:", name); }
}

console.log("CONFIG (specs §1–§2 structure + cutoffs):");
check("TOPIK I max 200", TOPIK_CONFIG.TOPIK_I.totalMax === 200);
check("TOPIK II max 300", TOPIK_CONFIG.TOPIK_II.totalMax === 300);
check("TOPIK I = Listening + Reading (2 sections, no Writing)",
  TOPIK_CONFIG.TOPIK_I.sections.length === 2 &&
  !TOPIK_CONFIG.TOPIK_I.sections.some((s) => s.section === "WRITING"));
check("TOPIK II = Listening + Writing + Reading (3 sections)",
  TOPIK_CONFIG.TOPIK_II.sections.length === 3 &&
  TOPIK_CONFIG.TOPIK_II.sections.some((s) => s.section === "WRITING"));
check("TOPIK I cutoffs L1:80 L2:140",
  JSON.stringify(TOPIK_CONFIG.TOPIK_I.cutoffs) === JSON.stringify([{ level: 1, min: 80 }, { level: 2, min: 140 }]));
check("TOPIK II cutoffs L3:120 L4:150 L5:190 L6:230",
  JSON.stringify(TOPIK_CONFIG.TOPIK_II.cutoffs) === JSON.stringify([{ level: 3, min: 120 }, { level: 4, min: 150 }, { level: 5, min: 190 }, { level: 6, min: 230 }]));

console.log("\nNO SECTIONAL MINIMUMS (specs §3 — the anti-JLPT law):");
// Config must carry NO floor/min field on any section (structural guarantee).
const anyFloor = [...TOPIK_CONFIG.TOPIK_I.sections, ...TOPIK_CONFIG.TOPIK_II.sections]
  .some((s) => "sectionalMin" in s || "floor" in s || "min" in s);
check("no section carries a sectionalMin/floor/min field", anyFloor === false);

console.log("\nCOMPENSATION (specs §3 example: 50 + 30 + 70 = 150 → Level 4):");
const comp = scoreTopik("TOPIK_II", [
  { section: "LISTENING", score: 50 },
  { section: "WRITING", score: 30 }, // weak section — in JLPT this would fail the whole test
  { section: "READING", score: 70 },
]);
check("total is 150", comp.total === 150);
check("awards Level 4 DESPITE the weak Writing section (compensation)", comp.level === 4);
check("no 'failed' wording anywhere", noFailWord(comp));

console.log("\nVERDICT BOUNDARIES (highest cutoff <= total; else no level):");
check("TOPIK I total 140 → Level 2", scoreTopik("TOPIK_I", [{ section: "LISTENING", score: 70 }, { section: "READING", score: 70 }]).level === 2);
check("TOPIK I total 139 → Level 1", scoreTopik("TOPIK_I", [{ section: "LISTENING", score: 70 }, { section: "READING", score: 69 }]).level === 1);
check("TOPIK I total 79 → no level yet (null)", scoreTopik("TOPIK_I", [{ section: "LISTENING", score: 40 }, { section: "READING", score: 39 }]).level === null);
check("TOPIK II total 230 → Level 6", scoreTopik("TOPIK_II", [{ section: "LISTENING", score: 80 }, { section: "WRITING", score: 70 }, { section: "READING", score: 80 }]).level === 6);
check("TOPIK II total 119 → no level yet (null)", scoreTopik("TOPIK_II", [{ section: "LISTENING", score: 40 }, { section: "WRITING", score: 39 }, { section: "READING", score: 40 }]).level === null);

console.log("\nNEVER 'FAILED' (specs §2, §9 — 'no level yet', not a fail grade):");
const belowI = scoreTopik("TOPIK_I", [{ section: "LISTENING", score: 10 }, { section: "READING", score: 10 }]);
check("below-threshold label is 'No level yet (practice)'", belowI.levelLabel === "No level yet (practice)");
check("no result field or line contains 'fail'", noFailWord(belowI) && noFailWord(comp));

console.log("\nWRITING = ESTIMATE (specs §5 — never an official score):");
const t2 = scoreTopik("TOPIK_II", [{ section: "LISTENING", score: 60 }, { section: "WRITING", score: 60 }, { section: "READING", score: 60 }]);
check("Writing section flagged isEstimate", t2.sections.find((s) => s.section === "WRITING")!.isEstimate === true);
check("Listening/Reading NOT flagged isEstimate", t2.sections.filter((s) => s.section !== "WRITING").every((s) => s.isEstimate === false));
check("whole result is a practice estimate", t2.isEstimate === true);
check("honesty line states no section minimums + only NIIED awards a level",
  /no section minimums/i.test(t2.honestyLine) && /NIIED/.test(t2.honestyLine));

console.log("\nCOMPENSATION GUIDANCE ('points cheapest here' = largest headroom):");
const guide = scoreTopik("TOPIK_II", [{ section: "LISTENING", score: 90 }, { section: "WRITING", score: 20 }, { section: "READING", score: 85 }]);
check("cheapest-gain section = Writing (largest headroom)", guide.cheapestGainSection === "WRITING");
check("nextCutoff points to a higher level with pointsToNext > 0", guide.nextCutoff !== null && guide.nextCutoff!.pointsToNext > 0);

console.log("\nNO SCALED-SCORE FICTION (direct totals only):");
check("result has total + levelLabel, no fabricated 'scaledScore' field", "total" in comp && "levelLabel" in comp && !("scaledScore" in comp));

function noFailWord(r: TopikResult): boolean {
  const blob = JSON.stringify(r).toLowerCase();
  return !/fail/.test(blob);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
