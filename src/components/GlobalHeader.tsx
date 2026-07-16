import { familyStrip } from "@smnasiruz016-blip/almi-data";
import Link from "next/link";
import { AuthNav } from "./AuthNav";

// AlmiWorld family navigation — complete, current family (all sibling products; the current
// product, AlmiKorean, is omitted from its own family list).
// The product list is NOT maintained here — it lives in @smnasiruz016-blip/almi-data,
// so adding a product is one edit there plus a version bump, not an edit in every
// repo. Inline is how this array silently fell behind: it stopped at AlmiDanish,
// because that is who existed on the day this repo was forked.
// ⚠️ "korean" is an IDENTITY, not a label — it omits THIS product from its own strip.
export const FAMILY_NAV = familyStrip("korean");

export function GlobalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-almi-line bg-almi-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" aria-label="AlmiKorean home" className="inline-flex shrink-0 items-center gap-2">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg bg-almi-coral text-lg font-bold text-almi-ink">
            한
          </span>
          <span className="text-xl font-semibold tracking-tight text-almi-ink">AlmiKorean</span>
        </Link>
        <nav aria-label="Family navigation" className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
          {FAMILY_NAV.map((item) => (
            <a key={item.href} href={item.href} className="rounded-sm text-base font-semibold text-almi-ink hover:text-almi-coral">
              {item.label}
            </a>
          ))}
        </nav>
        <AuthNav />
      </div>
    </header>
  );
}
