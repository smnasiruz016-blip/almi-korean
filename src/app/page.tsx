import Link from "next/link";
import { scoreTopik, TOPIK_CONFIG } from "@/lib/topik/scoring";

// Sample rendered from the REAL engine — proves the total-decides-the-level read-out.
// Listening 72 + Writing 48 (the weaker, AI-estimated section) + Reading 70 = 190 → Level 5.
// A strong total carries a soft section: TOPIK has no floors. That IS the product.
const SAMPLE = scoreTopik("TOPIK_II", [
  { section: "LISTENING", score: 72 },
  { section: "WRITING", score: 48 },
  { section: "READING", score: 70 },
]);

const LEVEL_MATRIX = [
  { track: "TOPIK I", lv: "Level 1", note: "Basic Korean: everyday greetings, self-introduction, and simple daily-life exchanges." },
  { track: "TOPIK I", lv: "Level 2", note: "Familiar-topic conversation, public-facing language (post office, bank), and simple connected text." },
  { track: "TOPIK II", lv: "Level 3", note: "Everyday and some social language; managing familiar tasks and reading straightforward paragraphs." },
  { track: "TOPIK II", lv: "Level 4", note: "The level universities and employers most often reference: news, common workplace and social topics." },
  { track: "TOPIK II", lv: "Level 5", note: "Social, academic and professional topics; less-familiar themes handled with relative ease." },
  { track: "TOPIK II", lv: "Level 6", note: "Near-full functional command: specialised, abstract and unfamiliar material read and understood." },
] as const;

function ScoreCard() {
  const cheapest = SAMPLE.sections.find((s) => s.section === SAMPLE.cheapestGainSection);
  return (
    <div className="rounded-2xl border border-almi-line bg-almi-paper p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-almi-ink">TOPIK II · {SAMPLE.levelLabel}</p>
        <span className="rounded-full bg-almi-bg-peach px-3 py-1 text-xs font-medium text-almi-text">practice estimate</span>
      </div>
      <dl className="mt-4 space-y-2">
        {SAMPLE.sections.map((s) => (
          <div key={s.section} className="flex items-center justify-between text-sm">
            <dt className="text-almi-text">
              {s.label}
              {s.isEstimate && <span className="ml-2 rounded bg-almi-bg-peach px-1.5 py-0.5 text-[10px] font-medium text-almi-text-muted">AI estimate</span>}
            </dt>
            <dd className="tabular-nums text-almi-text-muted">{s.score}/{s.scaleMax}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 border-t border-almi-line pt-4 text-sm">
        <p className="text-almi-text">
          Total{" "}
          <span className="font-semibold text-almi-ink">{SAMPLE.total}/{SAMPLE.totalMax}</span>
          {" → "}
          <span className="font-semibold text-almi-teal">{SAMPLE.levelLabel}</span>
        </p>
        {cheapest && (
          <p className="mt-2 text-almi-text">
            Points are cheapest for you in{" "}
            <span className="font-semibold text-almi-ink">{cheapest.label.replace(" (AI estimate)", "")}</span> ({cheapest.headroom} still available).
          </p>
        )}
        <p className="mt-2 text-xs text-almi-text-muted">{SAMPLE.honestyLine}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* 1. Hero */}
      <section className="px-6 pt-16 pb-14">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">ALMIKOREAN · TOPIK I + II PRACTICE</p>
            <h1 className="mt-4 text-4xl font-bold text-almi-ink sm:text-5xl">Practise TOPIK the honest way — your total decides your level.</h1>
            <p className="mt-5 max-w-2xl text-lg text-almi-text">
              Real task formats for both tracks — TOPIK I (Listening + Reading) and TOPIK II (Listening + Writing + Reading).
              TOPIK has <strong className="text-almi-ink">no section minimums</strong>: a strong section fully makes up for a
              weaker one, because your level comes from the total alone. Listening and Reading are point-scored directly; Writing
              is graded against the official criteria as a clearly-labelled estimate — never a made-up official score.
            </p>
            <div className="mt-7">
              <Link href="/signup" className="rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
                Practise free
              </Link>
              <p className="mt-3 text-sm text-almi-text-muted">TOPIK I → Levels 1–2 · TOPIK II → Levels 3–6. Sit either track directly.</p>
            </div>
            <p className="mt-4 text-xs text-almi-text-muted">
              $12/month · 7-day free trial · cancel anytime · generated Korean audio on every listening item · 100% original material, never copied
            </p>
          </div>
          <ScoreCard />
        </div>
      </section>

      {/* 2. Philosophy — no floors */}
      <section className="bg-almi-bg-peach/30 px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-almi-ink">One total, no floors — where a weak section can&apos;t sink you.</h2>
          <p className="mt-4 text-almi-text">
            Many language tests fail you if a single section dips under a hidden minimum. TOPIK does not. Your level is decided by
            the total alone — so if your reading is racing ahead while your listening lags, the points still count. We show each
            section&apos;s contribution to your total and point you to where the next level&apos;s points are cheapest for you.
          </p>
          <p className="mt-4 text-almi-text">
            Where a section can&apos;t be point-counted — the TOPIK II Writing tasks, graded by trained human raters on official
            criteria — we mirror those criteria transparently and label our number an <strong className="text-almi-ink">estimate</strong>,
            every time. Only NIIED&apos;s official sitting awards a real level, and your TOPIK certificate is valid for two years.
          </p>
        </div>
      </section>

      {/* 3. Sections */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-almi-ink">Train every section of the track you&apos;re sitting.</h2>
          <p className="mt-3 text-almi-text">
            Listening and Reading are auto-marked for instant feedback; Writing uses a live character counter against each
            task&apos;s required band and criteria-based feedback.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { t: "Listening", d: "Everyday and level-appropriate audio at natural pace, played once — the single-play discipline of the real test.", tag: "Auto-marked · generated audio" },
              { t: "Reading", d: "Short to long-form Korean texts matched to your track. Build the reading speed the exam clock demands.", tag: "Auto-marked" },
              { t: "Writing (TOPIK II)", d: "Tasks 51–54: sentence completion, a 200–300-character piece, and a 600–700-character essay — live character counter, criteria feedback, estimate never presented as official.", tag: "AI criteria estimate" },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-almi-line bg-almi-paper p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-almi-coral">{c.tag}</p>
                <h3 className="mt-2 font-semibold text-almi-ink">{c.t}</h3>
                <p className="mt-2 text-sm text-almi-text">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Level matrix */}
      <section className="bg-almi-bg-peach/30 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-almi-ink">Two tracks, six levels.</h2>
          <p className="mt-3 text-almi-text">
            TOPIK I awards Levels 1–2 out of {TOPIK_CONFIG.TOPIK_I.totalMax}; TOPIK II awards Levels 3–6 out of{" "}
            {TOPIK_CONFIG.TOPIK_II.totalMax}. Below the lowest cutoff no level is awarded — there is no &quot;fail&quot; grade, and
            we never use the word.
          </p>
          <div className="mt-6 space-y-3">
            {LEVEL_MATRIX.map(({ track, lv, note }) => (
              <div key={lv} className="flex flex-col gap-1 rounded-xl border border-almi-line bg-almi-paper p-4 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="shrink-0 font-bold text-almi-ink">{lv}</span>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-almi-coral">{track}</span>
                <span className="text-sm text-almi-text">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Value props */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-almi-ink">Honest practice built around how TOPIK actually scores you.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">Total-based, no section floors</h3>
              <p className="mt-2 text-sm text-almi-text">
                Your level is your total against the real cutoffs — a strong section compensates a weak one. We show each
                section&apos;s contribution and where your next-level points come cheapest. No hidden minimum can fail you.
              </p>
            </div>
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">100% original study items</h3>
              <p className="mt-2 text-sm text-almi-text">
                Every listening dialogue, reading passage and writing prompt is written from scratch in Korean. Nothing is taken
                from NIIED past papers or official materials — ever.
              </p>
            </div>
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">25% pledged to the Shamool Foundation</h3>
              <p className="mt-2 text-sm text-almi-text">
                25% of AlmiWorld&apos;s income supports the Shamool Foundation — a completely free school for children in Lahore,
                Pakistan. Your practice funds real classrooms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing */}
      <section className="bg-almi-bg-peach/30 px-6 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-almi-ink">Simple, honest pricing.</h2>
          <p className="mt-3 text-lg text-almi-text"><strong className="text-almi-ink">$12/month</strong> — 7-day free trial, cancel anytime.</p>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-almi-text">
            {[
              "Both tracks (TOPIK I and II), full practice and mock access",
              "Total-based level estimates with per-section contribution",
              "Timing matched to the real per-section limits",
              "Writing with live character counter + criteria feedback, labelled estimate",
              "100% original material — flat monthly price, cancel in one click",
            ].map((li) => (
              <li key={li} className="flex gap-2"><span className="text-almi-teal">✓</span>{li}</li>
            ))}
          </ul>
          <Link href="/signup" className="mt-7 inline-flex rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
            Practise free
          </Link>
        </div>
      </section>
    </main>
  );
}
