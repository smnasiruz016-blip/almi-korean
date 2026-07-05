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
const depts = load("kr-departments-wave2.json");

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

// ---- Wave 2: department units ----
const uniSlugs = new Set(unis.map((u) => u.slug));
ok(depts.length === 13477, `13,477 active department units (got ${depts.length})`);
ok(depts.every((d) => uniSlugs.has(d.uniSlug)), "every department belongs to a Wave-1 institution (no grad-school / closed-inst depts)");
ok(new Set(depts.map((d) => `${d.uniSlug}/${d.slug}`)).size === depts.length, "no duplicate {institution, department} pages (day/night merged)");
const badChar = depts.filter((d) => ["전문기술석사과정", "학석사통합과정", "특별과정"].includes(d.characteristic));
ok(badChar.length === 0, `0 grad-level/ambiguous units (전문기술석사/학석사통합/특별과정 excluded; got ${badChar.length})`);
ok(depts.every((d) => Array.isArray(d.dayNight) && d.dayNight.length >= 1), "every department records at least one day/night division");
const special = depts.filter((d) => d.charClass !== "regular").length;
console.log(`   → ${depts.length} units · ${special} carry a special-characteristic honest label`);

// ---- Locked Wave-1 + Wave-2 math (derived, never hardcoded literals in app code) ----
const fam = {
  university: unis.length * N,
  department: depts.length * N,
  level: 6 * N,
  topikInOrigin: N,
  studyRoute: N,
  eps: epsPages,
};
const total = Object.values(fam).reduce((a, b) => a + b, 0);
ok(fam.university === 75264, `Family 1 = ${fam.university} (384×196)`);
ok(fam.department === 2641492, `Wave 2 = ${fam.department} (13,477×196)`);
ok(fam.level === 1176, `Family 2 = ${fam.level} (6×196)`);
ok(total > 2700000 && total < 2730000, `Wave-1+2 total ≈ ${total}`);
console.log("   families:", JSON.stringify(fam), "→ total", total);

if (failed) { console.error(`\n${failed} assertion(s) FAILED`); process.exit(1); }
console.log("\nAll Phase-3 exclusion tests passed.");
