// Build-time FORK HYGIENE GATE — the AlmiWorld §7 rule, enforced instead of trusted.
//
// WHY THIS EXISTS. This repo's lineage is:
//   celpip → goethe → japanese → korean (you are here)
// AlmiKorean's first commit says "fork of almi-japanese"; its engine is the celpip→goethe
// network standard japanese was built on. So the leak surfaces are Japanese (from
// almi-japanese), German (Goethe), and Canadian English (CELPIP).
//
// ⚠️ THE JLPT SPLIT (verified against every shipped-content occurrence 2026-07-21):
// "JLPT" is NOT banned. A Korean TOPIK product legitimately CONTRASTS with the JLPT — its
// learners often studied Japanese first, and TOPIK's #1 differentiator is authored as
// "TOPIK has no JLPT-style sectional floors" / a dedicated jlpt-vs-topik comparison page.
// Every JLPT occurrence pairs JLPT (Japan) against TOPIK (Korea) as genuine differentiation
// — none is a copy-paste leak. This is the same split as french↔IRCC/CLB: the ancestor's
// EXAM name is shared context, but the ancestor's PRODUCT IDENTITY stays banned. So the
// `almi-japanese` slug (×4) and its session cookie must NEVER appear — that would be leaked
// identity, not contrast. If a JLPT line ever reads as leaked (TOPIK was meant), fix the
// FACT to TOPIK; do not add "JLPT" here.
//
// Product names are ENUMERATED in all four shapes. AlmiItalian is a DESCENDANT (forked
// FROM korean) — its nouns are not banned here.
//
// ⚠️ RE-CUT NOTES:
//  1. Korean nouns are THIS product's subject and are NOT banned: TOPIK, 한국어, ko-KR.
//  2. "JLPT" and Japanese exam terms are SHARED contrast context — not banned (see above).
//     The banned Japanese signal is the PRODUCT IDENTITY (almi-japanese slug + cookie).
//  3. German SKILL words banned by WORD BOUNDARY + case. Bare country names not banned.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "scripts", "prisma"];
const SCAN_EXT = /\.(ts|tsx|js|mjs|json|prisma|css|md)$/;

const ALLOWLIST = new Map([
  ["src/lib/nav/family.ts", "links to sibling AlmiWorld products by name"],
  ["scripts/fork-hygiene-gate.mjs", "documents the banned nouns"],
]);

const LINE_ESCAPE = "hygiene-allow";

// Ancestor (German + CELPIP) proper nouns. ⚠️ RE-CUT AT EVERY FORK. Korean nouns are NOT
// here; "JLPT" is NOT here (shared contrast); bare country names are not here.
const BANNED = [
  // — German (Goethe engine ancestor) — institution / exam / locale —
  "Goethe-Institut", "Goethe-Zertifikat", "TestDaF",
  "de-DE",
  // — CELPIP (root) — Canadian English test + framework —
  "CELPIP", "Canadian Language Benchmark",
  "Immigration, Refugees and Citizenship Canada",
  // Sibling/ancestor PRODUCT names appended below — GENERATED, not hand-listed.
  // NOTE this is where the Japanese IDENTITY is banned: almi-japanese ×4 shapes (below),
  // which also catches the "almi_japanese_session" cookie via its underscore form.
];

const ANCESTOR_PRODUCTS = ["celpip", "goethe", "japanese"];
/** Every form a product slug ships in: almi-x · almi_x · almix · AlmiX. */
function productNameForms(p) {
  return [`almi-${p}`, `almi_${p}`, `almi${p}`, `Almi${p[0].toUpperCase()}${p.slice(1)}`];
}
for (const p of ANCESTOR_PRODUCTS) BANNED.push(...productNameForms(p));
BANNED.push("AlmiCELPIP");

// SELF-CHECK — a global find-replace can rewrite this list to ban our own name.
const SELF_NAMES = ["AlmiKorean", "almi-korean", "almi_korean", "almikorean"];
for (const n of SELF_NAMES) {
  if (BANNED.some((b) => b.toLowerCase() === n.toLowerCase())) {
    console.error("");
    console.error(`FORK-HYGIENE GATE IS MISCONFIGURED: BANNED contains "${n}", which is THIS product's own name.`);
    console.error("Every legitimate mention of ourselves would be reported as an ancestor leak. Fix BANNED.");
    console.error("");
    process.exit(2);
  }
}

// Word-boundary bans (\b) — case matters for the German nouns (Capitalised). CLB/IRCC are
// Canadian; telc is a German exam. "JLPT" is deliberately absent — see the header.
const BANNED_WORD = ["CLB", "IRCC", "telc", "Schreiben", "Sprechen", "Hören", "Lesen"];

// ── Scanning machinery (real-entity-gate design: strip comments, scan STRING values).

function stripComments(text) {
  let out = "";
  let i = 0;
  let quote = null;
  let inLine = false;
  let inBlock = false;
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (inLine) {
      if (c === "\n") { inLine = false; out += c; }
      else out += " ";
      i++; continue;
    }
    if (inBlock) {
      if (c === "*" && n === "/") { inBlock = false; out += "  "; i += 2; continue; }
      out += c === "\n" ? c : " ";
      i++; continue;
    }
    if (quote) {
      if (c === "\\") { out += text.slice(i, i + 2); i += 2; continue; }
      if (c === quote) quote = null;
      out += c; i++; continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; out += c; i++; continue; }
    if (c === "/" && n === "/") { inLine = true; out += "  "; i += 2; continue; }
    if (c === "/" && n === "*") { inBlock = true; out += "  "; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

// Prisma comments are `//` and `///` — NOT `#`. stripComments handles `//` while
// respecting string literals, so prisma reuses it.

function jsonStrings(node, out = []) {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const v of node) jsonStrings(v, out);
  else if (node && typeof node === "object") for (const v of Object.values(node)) jsonStrings(v, out);
  return out;
}

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === "node_modules" || e === ".next" || e === ".git") continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.test(e)) out.push(full);
  }
  return out;
}

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    if (ALLOWLIST.has(rel)) continue;
    const raw = readFileSync(file, "utf8");
    let text;
    if (rel.endsWith(".json")) {
      try { text = jsonStrings(JSON.parse(raw)).join("\n"); }
      catch { text = raw; }
    } else if (rel.endsWith(".prisma")) {
      text = stripComments(raw);   // prisma comments are //
    } else {
      text = stripComments(raw);
    }
    const lines = text.split(/\r?\n/);
    const rawLines = raw.split(/\r?\n/);

    lines.forEach((line, i) => {
      if ((rawLines[i] ?? "").includes(LINE_ESCAPE)) return;
      for (const term of BANNED) {
        if (line.includes(term)) {
          violations.push(`${rel}:${i + 1}  banned ancestor noun "${term}"\n      ${line.trim().slice(0, 120)}`);
        }
      }
      for (const term of BANNED_WORD) {
        if (new RegExp(`\\b${term}\\b`).test(line)) {
          violations.push(`${rel}:${i + 1}  banned ancestor noun "${term}"\n      ${line.trim().slice(0, 120)}`);
        }
      }
    });
  }
}

if (violations.length) {
  console.error("\n✗ FORK HYGIENE GATE FAILED — ancestor content found.\n");
  console.error("  Korea must read as Korea. These are leaks from the fork lineage");
  console.error("  (celpip → goethe → japanese → korean). NOTE: 'JLPT' as authored TOPIK");
  console.error("  contrast is allowed; the banned Japanese signal is the almi-japanese identity.\n");
  for (const v of [...new Set(violations)]) console.error(`  ${v}`);
  console.error(`\n  ${violations.length} violation(s). Fix the FACT, not just the label.\n`);
  process.exit(1);
}

console.log(`✓ Fork hygiene gate: clean (no ancestor nouns across ${SCAN_DIRS.join(", ")}).`);
