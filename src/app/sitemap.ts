import type { MetadataRoute } from "next";
import { ORIGINS, UNIVERSITIES, DEPARTMENTS, LEVELS, EPS_PARTNERS, EPS_SECTORS } from "@/lib/seo/data";
import { CHUNK, uniChunks, TOTAL_CHUNKS, productSlice } from "@/lib/seo/plan";
import { SITE } from "@/lib/seo/content";

export const revalidate = 86_400;

export async function generateSitemaps() {
  return Array.from({ length: TOTAL_CHUNKS }, (_, i) => ({ id: i }));
}

const entry = (path: string, priority = 0.5): MetadataRoute.Sitemap[number] => ({
  url: `${SITE}${path}`,
  changeFrequency: "weekly",
  priority,
});

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const k = Number(await id); // Next 16: id arrives as a Promise — must await + Number or chunks emit 0 URLs.

  // Chunk 0: statics + core pages + every small family (level×origin, Family 3, Family 4, EPS).
  if (k === 0) {
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
    // Family 2: TOPIK level × origin
    for (const l of LEVELS) for (const o of ORIGINS) out.push(entry(`/topik/${l.level}/from/${o.slug}`, 0.6));
    // Family 3: TOPIK-in-{origin}
    for (const o of ORIGINS) out.push(entry(`/topik-in/${o.slug}`, 0.6));
    // Family 4: study-in-korea/{origin}
    for (const o of ORIGINS) out.push(entry(`/study-in-korea/${o.slug}`, 0.6));
    // Family 5: EPS (17 partners + sectors + overview already above) — NEVER ×196.
    for (const p of EPS_PARTNERS) out.push(entry(`/eps/${p.slug}`, 0.6));
    for (const s of EPS_SECTORS) out.push(entry(`/eps/sector/${s.slug}`, 0.5));
    return out;
  }

  // Chunks 1..uniChunks: Family 1 — university × origin, sliced by global index.
  if (k <= uniChunks) {
    const idx = k - 1;
    return productSlice(UNIVERSITIES, idx * CHUNK, (idx + 1) * CHUNK, (u, o) => `/university/${u.slug}/from/${o.slug}`).map((p) => entry(p));
  }

  // Remaining chunks: Wave 2 — department × origin, sliced by global index.
  const idx = k - uniChunks - 1;
  return productSlice(DEPARTMENTS, idx * CHUNK, (idx + 1) * CHUNK, (d, o) => `/university/${d.uniSlug}/${d.slug}/from/${o.slug}`).map((p) => entry(p));
}
