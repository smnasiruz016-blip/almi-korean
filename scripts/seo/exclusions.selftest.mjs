// AlmiKorean Phase-3 exclusion tests. Asserts the locked page-family math and the hard
// real-data-or-noindex exclusions directly against the committed datasets. Run in CI/build:
//   node scripts/seo/exclusions.selftest.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const load = (p) => JSON.parse(readFileSync(join(root, "src", "data", p), "utf8"));

const unis = load("kr-universities.json");
const origins = load("origins.json");
const eps = load("eps-partners.json");
const sectors = load("eps-sectors.json");

let failed = 0;
const ok = (cond, msg) => {
  if (!cond) { console.error("✗ " + msg); failed++; } else console.log("✓ " + msg);
};

const N = origins.length;

// ---- Institution dataset (Family 1 base) ----
ok(N === 196, `196 origins (got ${N})`);
ok(unis.length === 384, `384 active main-campus institutions (got ${unis.length})`);
const daehak = unis.filter((u) => u.cls === "대학").length;
const jeonmun = unis.filter((u) => u.cls === "전문대학").length;
ok(daehak === 218, `218 대학 (got ${daehak})`);
ok(jeonmun === 166, `166 전문대학 (got ${jeonmun})`);

// Exclusions enforced by construction — assert nothing slipped in.
ok(unis.every((u) => u.cls === "대학" || u.cls === "전문대학"), "no 대학원 / 대학원대학 in institution list");
ok(unis.every((u) => u.type === "University" || u.type === "Junior college"), "type is University or Junior college only");
ok(unis.every((u) => u.campus === "본교"), "every institution is a 본교 record (제2/3/4캠퍼스·분교 branch records excluded at ingest)");
ok(new Set(unis.map((u) => u.slug)).size === 384, "384 unique slugs (no duplicate institution pages)");

// Field-fillability honesty: English name is Wikidata-official OR flagged as generated; never blank.
ok(unis.every((u) => typeof u.nameEnGenerated === "boolean"), "every institution flags nameEnGenerated");
ok(unis.every((u) => u.nameKo && u.nameEn), "every institution has a Korean + English name (never blank)");
const official = unis.filter((u) => !u.nameEnGenerated).length;
console.log(`   → ${official} official Wikidata English names, ${384 - official} flagged-romanized`);

// ---- EPS restraint: exists ONLY for the 17 partners, never ×196 ----
ok(eps.length === 17, `17 EPS partner countries (got ${eps.length})`);
ok(eps.some((p) => p.slug === "tajikistan" && p.newest), "17th partner = Tajikistan (flagged newest)");
ok(sectors.length === 5, `5 E-9 sectors (got ${sectors.length})`);
const epsPages = eps.length + sectors.length + 1;
ok(epsPages < N, `EPS family (${epsPages} pages) is NOT ×196 — deliberate restraint`);

// ---- Locked Wave-1 math (derived, never hardcoded literals in app code) ----
const fam = {
  university: unis.length * N,
  level: 6 * N,
  topikInOrigin: N,
  studyRoute: N,
  eps: epsPages,
};
const total = Object.values(fam).reduce((a, b) => a + b, 0);
ok(fam.university === 75264, `Family 1 = ${fam.university} (384×196)`);
ok(fam.level === 1176, `Family 2 = ${fam.level} (6×196)`);
ok(total > 76000 && total < 78000, `Wave-1 total ≈ ${total} (target ~76,900)`);
console.log("   families:", JSON.stringify(fam), "→ total", total);

if (failed) { console.error(`\n${failed} assertion(s) FAILED`); process.exit(1); }
console.log("\nAll Phase-3 exclusion tests passed.");
