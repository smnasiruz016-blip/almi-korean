// AlmiKorean — site constants + shared honest-copy lines. Replaces the JLPT lib/seo/content
// helpers used by chrome/marketing pages (the full SEO content layer is rebuilt in Phase 3).
import { PRODUCT } from "@/lib/brand";

export const SITE = `https://${PRODUCT.domain}`;

/** Absolute canonical URL for a path (self-canonical everywhere). */
export function canonical(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE}${p === "/" ? "" : p}`;
}

// AlmiWorld pledge line — 25% of income to the Shamool Foundation (family-wide, on every page).
export const SHAMOOL_LINE =
  "AlmiWorld pledges 25% of its income to the Shamool Foundation.";
