"use client";

import { useMemo, useState } from "react";
import type { BankItem } from "@/lib/items";

// TOPIK II Writing (Tasks 51–54). Phase 1 = the composer with a LIVE character counter against
// each task's official band. AI criteria-based grading arrives later; we never present a score as
// official. Tasks 53 (200–300 자) and 54 (600–700 자) carry a required character band.
export function WritingComposer({ items }: { items: BankItem[] }) {
  const tasks = useMemo(() => items.filter((it) => it.payload.writing).map((it) => it.payload.writing!), [items]);
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const task = tasks[idx];

  if (!task) {
    return <div className="rounded-2xl border border-dashed border-almi-line bg-almi-paper p-6 text-almi-text">Writing prompts arrive with Batch 1.</div>;
  }

  const count = Array.from(text.trim()).length;
  const min = task.charMin;
  const max = task.charMax;
  const inBand = min != null && max != null ? count >= min && count <= max : true;
  const bandLabel = min != null && max != null ? `${min}–${max} characters` : "no fixed length";
  const counterColor = min == null || max == null ? "text-almi-text-muted" : inBand ? "text-almi-teal" : "text-almi-coral-deep";

  return (
    <div className="space-y-4">
      {tasks.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {tasks.map((t, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setText(""); }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${i === idx ? "bg-almi-coral text-almi-ink" : "border border-almi-line text-almi-text"}`}
            >
              Task {t.taskNumber}
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
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={task.taskNumber >= 54 ? 12 : 6}
          placeholder="여기에 작성하세요…"
          className="mt-4 w-full resize-y rounded-lg border border-almi-line bg-almi-bg p-3 text-almi-ink focus:border-almi-coral focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className={`tabular-nums font-semibold ${counterColor}`}>{count} 자{min != null && max != null ? ` / ${bandLabel}` : ""}</span>
          {min != null && max != null && (
            <span className="text-xs text-almi-text-muted">{inBand ? "within band" : count < min ? `${min - count} more to reach the band` : `${count - max} over the band`}</span>
          )}
        </div>
      </div>

      <p className="text-xs text-almi-text-muted">
        Real TOPIK Writing is graded by trained human raters on official criteria (content, structure, language use). Any score we
        show is an <strong>estimate</strong> mirroring those criteria — never an official result.
      </p>
    </div>
  );
}
