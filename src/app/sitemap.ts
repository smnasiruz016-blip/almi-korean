import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Phase-1 minimal sitemap (static routes only). Phase 5 replaces this with chunked sitemaps
// + a sitemap index once the SEO page families (institutions/levels/origins/EPS) are generated.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "", "/about", "/pricing", "/practice", "/login", "/signup",
    "/mock", "/mock/topik-i", "/mock/topik-ii",
    // Core informational pages (Phase 4)
    "/topik/levels", "/topik/how-scoring-works", "/topik/validity", "/topik/writing-guide",
    "/topik/test-dates", "/topik-vs-eps-topik", "/jlpt-vs-topik", "/eps", "/study-in-korea",
  ];
  return paths.map((p) => ({ url: `${SITE}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
}
