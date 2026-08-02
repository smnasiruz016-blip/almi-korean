"use client";

import { useMemo, useState } from "react";
import { errorFrom } from "@/lib/topik/graded-response";
import { asWritingGraded, type Band, type WritingGraded } from "@/lib/topik/writing-response";
import type { RunnerItem } from "@/lib/items";

// TOPIK II Writing (Tasks 51–54): the composer, a LIVE character counter against each task's
// band, and criteria-based AI feedback from /api/ko/writing.
//
// ── THE ITEM IS CARRIED, NOT JUST ITS PROMPT ──
// This used to map straight to `payload.writing` and throw the item away, which was fine for a
// counter and impossible for grading: the server re-loads the task by its stable id, so the id
// has to survive to the submit. The prompt is still rendered from the client copy, but the
// server never trusts it — it grades against its OWN copy of the task it loaded by that id.
//
// Nothing here computes a band or an estimate. Both come from the server, and both are labelled
// an estimate wherever they appear — real TOPIK 쓰기 is scored by trained human raters, and only
// NIIED awards a result.

const BAND_LABEL: Record<Band, string> = { strong: "Strong", adequate: "Adequate", limited: "Developing" };
const BAND_CLASS: Record<Band, string> = {
  strong: "border-almi-teal bg-almi-teal/10 text-almi-ink",
  adequate: "border-almi-line bg-almi-bg-peach/40 text-almi-ink",
  limited: "border-almi-coral bg-almi-coral/10 text-almi-ink",
};

function Criterion({ label, korean, band }: { label: string; korean: string; band: Band }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${BAND_CLASS[band]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-almi-text-muted">
        {label} <span className="font-normal">· {korean}</span>
      </p>
      <p className="mt-1 font-semibold">{BAND_LABEL[band]}</p>
    </div>
  );
}

export function WritingComposer({ items }: { items: RunnerItem[] }) {
  const tasks = useMemo(() => items.filter((it) => it.payload.writing), [items]);
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [graded, setGraded] = useState<WritingGraded | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const item = tasks[idx];
  const task = item?.payload.writing;

  if (!item || !task) {
    return <div className="rounded-2xl border border-dashed border-almi-line bg-almi-paper p-6 text-almi-text">Writing prompts arrive with Batch 1.</div>;
  }

  const count = Array.from(text.trim()).length;
  const min = task.charMin;
  const max = task.charMax;
  const inBand = min != null && max != null ? count >= min && count <= max : true;
  const bandLabel = min != null && max != null ? `${min}–${max} characters` : "no fixed length";
  const counterColor = min == null || max == null ? "text-almi-text-muted" : inBand ? "text-almi-teal" : "text-almi-coral-deep";

  function pick(i: number) {
    setIdx(i);
    setText("");
    setGraded(null);
    setError(null);
  }

  async function submit() {
    if (busy || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      // The id and the learner's Korean. Nothing else — no prompt, no task number, no band.
      const res = await fetch("/api/ko/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, text }),
      });
      // Checked, not cast — see lib/topik/writing-response.ts.
      const raw: unknown = await res.json();
      const data = asWritingGraded(raw);
      if (!res.ok || !data) setError(errorFrom(raw, "Could not assess this response right now."));
      else setGraded(data);
    } catch {
      setError("Could not reach the feedback service.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {tasks.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {tasks.map((it, i) => (
            <button
              key={it.id}
              onClick={() => pick(i)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${i === idx ? "bg-almi-coral text-almi-ink" : "border border-almi-line text-almi-text"}`}
            >
              Task {it.payload.writing!.taskNumber}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-almi-line bg-almi-paper p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-almi-coral">Task {task.taskNumber}</p>
          <span className="text-xs text-almi-text-muted">Required: {bandLabel}</span>
        </div>
        <p className="mt-2 whitespace-pre-line text-almi-text">{task.prompt}</p>
        {task.guidance && <p className="mt-2 text-xs text-almi-text-muted">{task.guidance}</p>}

        <textarea
          // The prompt above is the visible label but is far too long to read out as an
          // accessible name, so the name is short and the counter is wired as the description.
          aria-label={`Your response to Writing Task ${task.taskNumber}`}
          aria-describedby={`writing-count-${item.id}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={task.taskNumber >= 54 ? 12 : 6}
          placeholder={task.taskNumber <= 52 ? "㉠ …\n㉡ …" : "여기에 작성하세요…"}
          className="mt-4 w-full resize-y rounded-lg border border-almi-line bg-almi-bg p-3 text-almi-ink focus:border-almi-coral focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between text-sm">
          {/* The count changes on every keystroke, so it is polite-announced rather than
              assertive — a screen reader should not interrupt typing to read a number. */}
          <span id={`writing-count-${item.id}`} aria-live="polite" className={`tabular-nums font-semibold ${counterColor}`}>
            {count} 자{min != null && max != null ? ` / ${bandLabel}` : ""}
          </span>
          {min != null && max != null && (
            <span className="text-xs text-almi-text-muted">{inBand ? "within band" : count < min ? `${min - count} more to reach the band` : `${count - max} over the band`}</span>
          )}
        </div>

        <button
          onClick={submit}
          disabled={busy || count === 0}
          className="mt-4 rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark disabled:opacity-40"
        >
          {busy ? "Assessing…" : graded ? "Assess again" : "Get criteria feedback"}
        </button>
      </div>

      {/* role="alert" so the failure is ANNOUNCED, not just coloured. Without it the only
          signal that an assessment failed is a red box a screen-reader user never hears. */}
      {error && <p role="alert" className="rounded-xl bg-almi-coral/10 px-4 py-3 text-sm text-almi-coral-deep">{error}</p>}

      {graded && (
        <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
          <div className="flex items-baseline justify-between">
            <p className="font-semibold text-almi-ink">Task {graded.taskNumber} · criteria feedback</p>
            <span className="rounded-full bg-almi-bg-peach px-3 py-1 text-xs text-almi-text">practice estimate</span>
          </div>

          <p className="mt-3 text-almi-text">
            Practice estimate: <strong className="text-almi-ink">{graded.estimate}/100</strong>
            {graded.band && (
              <span className="text-almi-text-muted">
                {" "}· {graded.chars} 자 ({graded.band.withinBand ? "within" : "outside"} the {graded.band.min}–{graded.band.max} band)
              </span>
            )}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Criterion label="Content & task" korean="내용 및 과제 수행" band={graded.feedback.contentAndTask} />
            {/* Absent for Tasks 51/52 by design — a blank completion has no discourse to
                organise, so no band is shown rather than an empty one. */}
            {graded.feedback.organization && (
              <Criterion label="Organisation" korean="글의 전개 구조" band={graded.feedback.organization} />
            )}
            <Criterion label="Language use" korean="언어사용" band={graded.feedback.languageUse} />
          </div>

          <p className="mt-4 text-almi-text">{graded.feedback.overallComment}</p>

          {graded.feedback.strengths.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-almi-text-muted">What worked</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-almi-text">
                {graded.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {graded.feedback.improvements.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-almi-text-muted">Next time</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-almi-text">
                {graded.feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-almi-text-muted">
            This estimate is AlmiKorean&apos;s own, derived from the criteria bands above — it is not TOPIK&apos;s official
            weighting and not an official score. Real TOPIK 쓰기 is graded by trained human raters, and only NIIED&apos;s official
            sitting awards a result.
          </p>
        </div>
      )}

      <p className="text-xs text-almi-text-muted">
        Real TOPIK Writing is graded by trained human raters on official criteria (내용 및 과제 수행, 글의 전개 구조,
        언어사용). Anything shown here is an <strong>estimate</strong> mirroring those criteria — never an official result.
      </p>
    </div>
  );
}
