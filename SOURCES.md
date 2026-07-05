# AlmiKorean — Data Sources & Attribution (Phase 3 / Wave 1)

All SEO page families are generated from **real, licence-cleared data only**. No institution,
count, or corridor fact is invented. Every count is derived from the datasets below at build time.

## Published sources (fields shown on pages)

### 1. Institution list — Family 1 (`src/data/kr-universities.json`, 384 rows)
- **Source:** KCUE University Information Disclosure (대학알리미) — **교육편제단위 dataset** on data.go.kr
  (dataset 15139338). **Licence:** 이용허락범위 = **"제한 없음" (No Restrictions)** — confirmed.
- **Reference date:** 2024-10-07 (KCUE annual survey round).
- **Fields published from this source:** official Korean name (학교명), class (대학구분 → 대학/전문대학),
  region ((대학)지역), main/branch flag (본분교).
- **Filter applied:** active **main-campus** (본분교 = 본교) 대학 + 전문대학 only.
  → 218 대학 + 166 전문대학 = **384**.

### 2. English names & coordinates (merged into the same file)
- **Source:** **Wikidata** (CC0 public domain). English label + latitude/longitude.
- Matched 262/384 institutions by Korean name. For the 122 unmatched, the English name is a
  **machine romanization flagged `nameEnGenerated: true`** and labelled on-page as
  "romanized — not the official English name". Coordinates present for 234 institutions.

## Derivation-only source (NOT published)
### 3. 학교개황 (A1) — cross-check aid only
- Used ONLY to derive the active/폐교 exclusion (본교/폐교 status). Its own fields
  (설립구분 국립/공립/사립, 학교홈페이지, address, 개교일) are **NOT republished** on any page,
  because its dataset licence line is not yet confirmed. Where §3 of the page spec listed those
  fields, they are intentionally **omitted** rather than pulled from A1.

## Department units — Wave 2 (`src/data/kr-departments-wave2.json`, 13,477 units)
- **Source:** same KCUE 교육편제단위 dataset (A2, licence 제한 없음, ref 2024-10-07) — the department rows.
- **Filter:** active 학과상태 (status not containing 폐) → 28,104 active; joined to the 384 Wave-1
  institutions by 학교코드 (grad schools auto-excluded) → 14,512; day/night (주야간구분) merged to one
  unit per {institution, department} → 13,518; minus 41 grad-level/ambiguous units
  (전문기술석사과정 30 · 학석사통합과정 6 · 특별과정 5) → **13,477**.
- **Fields published:** department name (hangul primary + flagged romanization), 단과대학 college,
  대/중/소계열 classification, 학위과정 degree, 수업연한 length, day/night divisions, 소재지 location,
  and an honest label for special characteristics (계약학과 → contract; 산업체위탁 → industry-commissioned;
  전공심화 → bachelor's-completion). **Language of instruction is NOT in the dataset — pages never claim it.**
- Page count = 13,477 × 196 origins = **2,641,492**. Route: `/university/[uni]/[dept]/from/[origin]`.

## EPS corridor data — Family 5 (`src/data/eps-partners.json`, `eps-sectors.json`)
- 17 EPS-TOPIK partner countries (17th = Tajikistan, MOU 2024-10-31). 5 main E-9 sectors.
- **Secondary reporting** pending an official **eps.go.kr / MOEL** lock at build; the 2026 E-9
  quota (~80,000) and per-country sending agencies are directional and point users to eps.go.kr.
  EPS pages are generated for partner countries ONLY — never × 196 origins.

## Origins — localization axis (`src/data/origins.json`, 196)
- 196 applicant-origin countries (slug/name/iso2/region/language label). Tier-1 = the 17 EPS partners.

## Exclusions (enforced by `npm run selftest:seo`)
- 폐교 (470 closed) → zero pages. Branch campuses (제2/3/4캠퍼스, 분교) → zero pages (본교-only).
- 대학원 / 대학원대학 → zero Family-1 pages. EPS family asserted ≤ 17 partners (never ×196).

## Annual refresh (Known-Date Registry)
- KCUE re-publishes the disclosure each survey round (~October). Re-verify institution list and
  reference date on the next round. TOPIK sitting windows + EPS quota are separate re-verify tasks.

*Processed/edited by AlmiWorld. Not presented as issued by the Government of the Republic of Korea.*
