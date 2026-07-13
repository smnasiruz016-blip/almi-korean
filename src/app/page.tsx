import type { Metadata } from "next";
import Link from "next/link";
import { scoreTopik, TOPIK_CONFIG } from "@/lib/topik/scoring";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute title bypasses the layout's "%s · AlmiKorean" template (no double-brand).
  // Keyword-first for CTR; honest (readiness range, not a fake/official score); no banned verbs.
  title: { absolute: "TOPIK Practice Test — See Your Real Readiness | AlmiKorean" },
  description:
    "No fake percentages — a strict, calibrated readiness range mapped to real TOPIK I & II level cutoffs across Listening, Reading and Writing. See where you really stand.",
  alternates: { canonical: canonical("/") },
};

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
  { track: "TOPIK I", lv: "Level 2", note: "Familiar-topic conversation, public-facing situations (post office, bank), and simple connected text." },
  { track: "TOPIK II", lv: "Level 3", note: "Everyday and some social language; managing familiar tasks and reading straightforward paragraphs." },
  { track: "TOPIK II", lv: "Level 4", note: "Following news articles and general social themes; the band universities and employers most often reference." },
  { track: "TOPIK II", lv: "Level 5", note: "Professional and academic range: discussing less-familiar social and abstract topics with growing precision." },
  { track: "TOPIK II", lv: "Level 6", note: "Advanced command: handling research-level texts and expressing complex ideas accurately in professional settings." },
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
                Start your 7-day free trial
              </Link>
              <p className="mt-3 text-sm text-almi-text-muted">
                TOPIK I → Levels 1–2 · TOPIK II → Levels 3–6 · sit either track directly · below the lowest cutoff no level is
                awarded — never &quot;failed.&quot;
              </p>
            </div>
            <p className="mt-4 text-sm text-almi-text-muted">
              $12/month, 7-day free trial, cancel anytime · Both TOPIK tracks (I + II) · 100% original material, never copied
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
            the total alone — so if your reading is racing ahead while your listening lags, every point still counts. We show each
            section&apos;s contribution to your total and point you to where the next level&apos;s points are cheapest for you.
          </p>
          <p className="mt-4 text-almi-text">
            Where a section can&apos;t be point-counted — the TOPIK II Writing tasks, graded on the real exam by trained human raters
            against official criteria — we mirror those criteria transparently and label our number an{" "}
            <strong className="text-almi-ink">estimate</strong>, every time. Only NIIED&apos;s official sitting awards a real level,
            and your TOPIK certificate is valid for two years — so time your sitting to your application window.
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
              { t: "Listening", d: "Everyday and level-appropriate dialogues in clear generated Korean audio at a natural pace, played once — the single-play discipline of the real test.", tag: "Auto-marked · played once", m: "TOPIK I: 30 questions /100 · TOPIK II: 50 questions /100" },
              { t: "Reading", d: "Short to long-form Korean texts matched to your track — from signs and notices to full argumentative passages. Build the reading speed the exam clock demands.", tag: "Auto-marked", m: "TOPIK I: 40 questions /100 · TOPIK II: 50 questions /100" },
              { t: "Writing (TOPIK II)", d: "Tasks 51–54: sentence completion, a 200–300-character piece, and the 600–700-character essay — live character counter, criteria-family feedback, and a number that is always labelled an estimate, never official.", tag: "Criteria-based estimate", m: "Tasks 51–54 · character-count discipline" },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-almi-line bg-almi-paper p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-almi-coral">{c.tag}</p>
                <h3 className="mt-2 font-semibold text-almi-ink">{c.t}</h3>
                <p className="mt-2 text-sm text-almi-text">{c.d}</p>
                <p className="mt-3 text-xs font-medium text-almi-text-muted">{c.m}</p>
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
          <p className="mt-2 text-sm font-medium text-almi-text-muted">
            Cutoffs: {TOPIK_CONFIG.TOPIK_I.cutoffs.map((c) => `L${c.level} ${c.min}+`).join(" · ")} (of{" "}
            {TOPIK_CONFIG.TOPIK_I.totalMax}) — {TOPIK_CONFIG.TOPIK_II.cutoffs.map((c) => `L${c.level} ${c.min}+`).join(" · ")} (of{" "}
            {TOPIK_CONFIG.TOPIK_II.totalMax}).
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
          <h2 className="text-2xl font-bold text-almi-ink">Transparent, level-driven Korean practice.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">One-play audio, like the real exam</h3>
              <p className="mt-2 text-sm text-almi-text">
                The real TOPIK gives no second chances on audio. Our listening items lock to single-play mode, so your focus trains
                the way test day demands.
              </p>
            </div>
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">100% original study items</h3>
              <p className="mt-2 text-sm text-almi-text">
                Every dialogue, passage and writing prompt is written from scratch. TOPIK past papers are published — copying them
                is easy, which is exactly why we never do.
              </p>
            </div>
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">Know which test you actually need</h3>
              <p className="mt-2 text-sm text-almi-text">
                Standard TOPIK is for study, points visas and residence. The E-9 work route runs on a different test —{" "}
                <strong className="text-almi-ink">EPS-TOPIK</strong>. Our{" "}
                <Link href="/topik-vs-eps-topik" className="text-almi-coral hover:underline">honest guide</Link> keeps you from
                preparing for the wrong exam.
              </p>
            </div>
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">25% pledged to the Shamool Foundation</h3>
              <p className="mt-2 text-sm text-almi-text">
                25% of AlmiWorld&apos;s income supports the Shamool Foundation — a completely free school in Lahore, Pakistan,
                providing education, meals, books and uniforms to over 60 children. Your practice funds real classrooms.
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
              "Both tracks (TOPIK I + II), full practice and sequenced mocks",
              "AI criteria feedback on all TOPIK II Writing tasks (51–54), always labelled an estimate",
              "Live character counter mapped to each task's real required band",
              "Unlimited auto-marked Listening and Reading with clear generated Korean audio",
              "Flat monthly price — cancel in one click from your dashboard",
            ].map((li) => (
              <li key={li} className="flex gap-2"><span className="text-almi-teal">✓</span>{li}</li>
            ))}
          </ul>
          <Link href="/signup" className="mt-7 inline-flex rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
            Start your 7-day free trial
          </Link>
          <p className="mt-4 text-sm">
            <Link href="/pricing" className="text-almi-coral hover:underline">See full pricing</Link>
          </p>
        </div>
      </section>

      {/* 7. Q&A */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-almi-ink">Questions, answered.</h2>
          <dl className="mt-8 space-y-6">
            {[
              {
                q: "How much does it cost?",
                a: "$12/month with a 7-day free trial. Cancel anytime during the trial and you are not charged.",
              },
              {
                q: "Which test do you cover?",
                a: "TOPIK — both tracks, TOPIK I (Levels 1–2) and TOPIK II (Levels 3–6), with sequenced timed mocks.",
              },
              {
                q: "Is the Writing score official?",
                a: "No. TOPIK II Writing (Tasks 51–54) is scored as an AI criteria-based estimate to guide you — NIIED alone awards real results.",
              },
              {
                q: "Do I need an account to start?",
                a: "Yes — create an account, start your 7-day free trial, and your practice is ready straight away.",
              },
              {
                q: "Can I cancel?",
                a: "Yes, anytime, from your account. Cancel before the trial ends and you pay nothing.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-almi-line bg-almi-paper p-6">
                <dt className="font-semibold text-almi-ink">{item.q}</dt>
                <dd className="mt-2 text-sm text-almi-text">{item.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 text-center">
            <Link href="/signup" className="rounded-full bg-almi-coral px-7 py-3 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
              Create your account →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
