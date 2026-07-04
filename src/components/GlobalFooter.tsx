import { FAMILY_NAV } from "./GlobalHeader";

export function GlobalFooter() {
  return (
    <footer className="mt-16 border-t border-almi-line bg-almi-bg-peach/40">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-almi-text">
        <p className="max-w-3xl">
          <strong className="text-almi-ink">AlmiKorean</strong> — honest TOPIK (Levels 1–6) practice.
          Total-based level estimates, no section floors, Writing labelled an estimate — never a fabricated official
          score. 25% of AlmiWorld&apos;s income supports the{" "}
          <a href="https://shamoolfoundation.com/" className="text-almi-coral hover:underline">
            Shamool Foundation
          </a>
          , a completely free school for children in Lahore, Pakistan.
        </p>
        <nav aria-label="AlmiWorld family" className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-almi-text-muted">
          {FAMILY_NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-almi-coral">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
