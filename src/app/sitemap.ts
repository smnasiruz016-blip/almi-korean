import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Phase-1 minimal sitemap (static routes only). Phase 5 replaces this with chunked sitemaps
// + a sitemap index once the SEO page families (institutions/levels/origins/EPS) are generated.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/about", "/pricing", "/practice", "/login", "/signup"];
  return paths.map((p) => ({ url: `${SITE}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
}
