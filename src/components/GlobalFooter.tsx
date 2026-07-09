import { FAMILY_NAV } from "./GlobalHeader";

// Dark family footer — AlmiWorld Global Nav Spec v1 §3 (matches the AlmiPrep
// reference: ink #14110D ground, gold #D4A24C headings, light body text).
export function GlobalFooter() {
  return (
    <footer className="mt-16 bg-[#14110D] text-white/75">
      <div className="mx-auto max-w-7xl px-6 py-12 text-sm">
        <p className="max-w-3xl text-white/75">
          <strong className="text-white">AlmiKorean</strong> — honest TOPIK (Levels 1–6) practice.
          Total-based level estimates, no section floors, Writing labelled an estimate — never a fabricated
          official score. 25% of AlmiWorld&apos;s income supports the{" "}
          <a href="https://shamoolfoundation.com/" className="text-[#D4A24C] hover:underline">
            Shamool Foundation
          </a>
          , a completely free school for children in Lahore, Pakistan.
        </p>

        <p className="mt-8 text-xs font-bold uppercase tracking-wider text-[#D4A24C]">AlmiWorld family</p>
        <nav aria-label="AlmiWorld family" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {FAMILY_NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-white/75 transition-colors hover:text-[#D4A24C]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-10 border-t border-white/15 pt-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} AlmiWorld. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
