import Link from "next/link";
import { AuthNav } from "./AuthNav";

// AlmiWorld family navigation — complete, current family (all sibling products; the current
// product, AlmiKorean, is omitted from its own family list).
export const FAMILY_NAV = [
  { label: "Home", href: "https://almiworld.com/" },
  { label: "eBooks", href: "https://almiworld.com/ebooks-2/" },
  { label: "AlmiJob", href: "https://almijob.almiworld.com/" },
  { label: "Salary Checker", href: "https://almisalary.almiworld.com" },
  { label: "AlmiCV", href: "https://almicv.almiworld.com" },
  { label: "AlmiStudy", href: "https://almistudy.almiworld.com/" },
  { label: "AlmiPrep", href: "https://almiprep.almiworld.com/" },
  { label: "AlmiPTE", href: "https://almipte.almiworld.com/" },
  { label: "AlmiTOEFL", href: "https://almitoefl.almiworld.com/" },
  { label: "AlmiOET", href: "https://almioet.almiworld.com/" },
  { label: "AlmiDET", href: "https://almidet.almiworld.com/" },
  { label: "AlmiCELPIP", href: "https://almicelpip.almiworld.com/" },
  { label: "AlmiFrench", href: "https://almifrench.almiworld.com/" },
  { label: "AlmiGoethe", href: "https://almigoethe.almiworld.com/" },
  { label: "AlmiPortuguese", href: "https://almiportuguese.almiworld.com/" },
  { label: "AlmiSpanish", href: "https://almispanish.almiworld.com/" },
  { label: "AlmiJapanese", href: "https://almijapanese.almiworld.com/" },
  { label: "AlmiItalian", href: "https://almiitalian.almiworld.com/" },
  { label: "Contact Us", href: "https://almiworld.com/contact-us/" },
  { label: "Shamool Foundation", href: "https://shamoolfoundation.com/" },
];

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
