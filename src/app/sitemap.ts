import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/content";

// HOLDING 2026-08-09 — the sitemap now advertises ONLY the keep-set (statics + the two bounded
// origin hubs + EPS), all of which are prerendered static pages. The 70-shard plan that enumerated
// 2,717,932 generated URLs (level×origin, university×origin, department×origin) is withdrawn so
// Googlebot stops queueing URLs that no longer render. `@/lib/seo/plan` still holds the full
// chunking math untouched — restore the old imports + generateSitemaps to reverse.
export const revalidate = false;

export async function generateSitemaps() {
  return [{ id: 0 }];
}

const entry = (path: string, priority = 0.5): MetadataRoute.Sitemap[number] => ({
  url: `${SITE}${path}`,
  changeFrequency: "weekly",
  priority,
});

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  void (await id); // Next 16: id arrives as a Promise — must be awaited even though only chunk 0 exists.

  const out: MetadataRoute.Sitemap = [
    entry("/", 1),
    entry("/pricing", 0.7),
    entry("/signup", 0.5),
    entry("/login", 0.3),
    entry("/practice", 0.7),
    entry("/mock", 0.7),
    entry("/mock/topik-i", 0.6),
    entry("/mock/topik-ii", 0.6),
    entry("/about", 0.5),
    entry("/privacy", 0.3),
    // Core honesty/explainer pages (§5) — high-intent, zero-fabrication.
    entry("/topik/levels", 0.8),
    entry("/topik/how-scoring-works", 0.8),
    entry("/topik/validity", 0.7),
    entry("/topik/writing-guide", 0.7),
    entry("/topik/test-dates", 0.7),
    entry("/topik-vs-eps-topik", 0.8),
    entry("/jlpt-vs-topik", 0.7),
    entry("/eps", 0.7),
    entry("/study-in-korea", 0.7),
  ];
  // COST FIX 26 Oct 2026 — every programmatic family was removed (owner ruling 17 Oct: deleted,
  // no redirects) and answers 410 Gone from src/proxy.ts: /topik-in/*, /study-in-korea/<origin>,
  // /eps/<country>, /eps/sector/*, /topik/<level>/from/*, /university/<uni>[/<dept>]/from/*.
  // The /eps and /study-in-korea overview pages above stay.
  return out;
}
