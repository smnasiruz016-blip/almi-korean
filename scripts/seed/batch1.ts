// AlmiKorean — seed Batch-1 into the DB. Run: npm run seed:batch1
// Deferred-to-deploy: requires DATABASE_URL (founder-provisioned Neon). Idempotent upsert keyed
// on {track, section, title}. Re-parses each row through the shared Zod schema before writing.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, type TopikTaskType, type TopikDifficulty } from "@prisma/client";
import { itemSchema } from "../../src/lib/topik/items";

const prisma = new PrismaClient();

async function main() {
  // Read the committed bundled bank (same content the app loads) so deploy-time seeding needs
  // no regenerated build artifact.
  const path = join(process.cwd(), "src", "data", "items-batch1.json");
  const rows: unknown[] = JSON.parse(readFileSync(path, "utf8"));

  let upserts = 0;
  for (const raw of rows) {
    const item = itemSchema.parse(raw); // throws on any invalid row — never seed garbage
    await prisma.koreanItem.upsert({
      where: { track_section_title: { track: item.track, section: item.section, title: item.title } },
      update: {
        taskType: item.taskType as TopikTaskType,
        difficulty: item.difficulty as TopikDifficulty,
        prompt: item.prompt ?? null,
        topicTag: item.topicTag ?? null,
        guidanceNote: item.guidanceNote ?? null,
        payload: item.payload,
      },
      create: {
        track: item.track,
        section: item.section,
        taskType: item.taskType as TopikTaskType,
        difficulty: item.difficulty as TopikDifficulty,
        title: item.title,
        prompt: item.prompt ?? null,
        topicTag: item.topicTag ?? null,
        guidanceNote: item.guidanceNote ?? null,
        payload: item.payload,
      },
    });
    upserts++;
  }

  const total = await prisma.koreanItem.count();
  console.log(`✓ seeded ${upserts} items; KoreanItem now has ${total} rows`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
