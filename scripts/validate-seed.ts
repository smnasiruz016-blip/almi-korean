// AlmiKorean — validate the built Batch-1 bank against the shared Zod itemSchema.
// Run: npm run validate:seed  (after npm run build:batch1)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { itemSchema } from "../src/lib/topik/items";

const path = join(process.cwd(), "scripts", "seed", "gen", "batch1.json");
const items: unknown[] = JSON.parse(readFileSync(path, "utf8"));

let ok = 0;
let bad = 0;
items.forEach((raw, i) => {
  const r = itemSchema.safeParse(raw);
  if (r.success) {
    ok++;
  } else {
    bad++;
    const title = (raw as { title?: string })?.title ?? `#${i}`;
    console.error(`✗ ${title}:`, r.error.issues.map((iss) => `${iss.path.join(".")}: ${iss.message}`).join(" | "));
  }
});

console.log(`\n${ok} valid, ${bad} invalid (of ${items.length})`);
if (bad > 0) process.exit(1);
