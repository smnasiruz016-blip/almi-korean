import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/content";

// AI crawlers are NEVER blocked (owner ruling 27 Oct 2026: AI visibility is the product goal).
// GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, anthropic-ai, PerplexityBot,
// Google-Extended, CCBot, Amazonbot, Bytespider, Meta-ExternalAgent and the like fall under `*`.
// Only pure SEO-tool scrapers (no search or AI audience) stay off entirely.
//
// The old DEEP_LEAVES disallow (/topik/*/from/, /university/*/from/) is gone too: it covered only
// the removed programmatic pages, which now answer 410 Gone from src/proxy.ts — crawlers must be
// able to SEE the 410 to drop those URLs.
const SEO_TOOL_SCRAPERS = ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["Googlebot", "Bingbot"], allow: "/", disallow: ["/api/"] },
      { userAgent: "*", allow: "/", disallow: ["/api/"], crawlDelay: 10 },
      { userAgent: SEO_TOOL_SCRAPERS, disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap-index.xml`,
    host: SITE,
  };
}
