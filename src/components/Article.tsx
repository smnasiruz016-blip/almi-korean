import { SHAMOOL_LINE } from "@/lib/site";

// Shared shell for the core informational pages (§4). Keeps the Shamool line + spacing consistent.
export function Article({
  eyebrow,
  title,
  lede,
  children,
  shamool = true,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  shamool?: boolean;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink sm:text-4xl">{title}</h1>
      {lede && <p className="mt-4 text-lg text-almi-text">{lede}</p>}
      <div className="mt-8 space-y-4 text-almi-text [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-almi-ink [&_strong]:text-almi-ink">
        {children}
      </div>
      {shamool && <p className="mt-10 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>}
    </main>
  );
}
