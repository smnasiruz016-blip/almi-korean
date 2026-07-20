import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/content";

// Deep per-origin long-tail leaves. Origin HUBS (/topik-in/<origin>,
// /study-in-korea/<origin>, /eps/<country>) stay crawlable; only /from/ leaves
// are trimmed. "/university/*/from/" covers both /university/[uni]/from/ and
// /university/[uni]/[dept]/from/ (the wildcard spans path segments).
const DEEP_LEAVES = ["/topik/*/from/", "/university/*/from/"];

const HEAVY_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai",
  "CCBot", "Bytespider", "Amazonbot", "PerplexityBot", "Google-Extended",
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot", "PetalBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["Googlebot", "Bingbot"], allow: "/", disallow: ["/api/"] },
      { userAgent: "*", allow: "/", disallow: ["/api/", ...DEEP_LEAVES], crawlDelay: 10 },
      { userAgent: HEAVY_BOTS, disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap-index.xml`,
    host: SITE,
  };
}
