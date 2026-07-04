"use client";

import { useMemo, useState } from "react";
import type { BankItem } from "@/lib/items";
import type { TopikTrack, TopikSkill } from "@prisma/client";

const SECTION_LABEL: Record<TopikSkill, string> = { LISTENING: "Listening", READING: "Reading", WRITING: "Writing" };
const TRACK_LABEL: Record<TopikTrack, string> = { TOPIK_I: "TOPIK I", TOPIK_II: "TOPIK II" };

// Objective sections only (Listening / Reading). Writing uses WritingComposer.
export function PracticeRunner({ items, track, section }: { items: BankItem[]; track: TopikTrack; section: TopikSkill }) {
  const flat = useMemo(
    () => items.flatMap((it, i) => (it.payload.questions ?? []).map((q) => ({ key: `${i}:${q.id}`, item: it, q }))),
    [items]
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const correct = flat.filter((f) => answers[f.key] === f.q.answer).length;
  const total = flat.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
          {it.payload.passages?.map((p) => (
            <p key={p.id} className="mb-3 whitespace-pre-line rounded-lg bg-almi-bg-peach/30 p-3 text-sm text-almi-text">{p.body}</p>
          ))}
          {(it.payload.questions ?? []).map((q) => {
            const key = `${i}:${q.id}`;
            return (
              <fieldset key={q.id} className="mb-3">
                <legend className="text-sm font-medium text-almi-ink">{q.stem}</legend>
                <div className="mt-2 grid gap-1.5">
                  {q.options.map((o) => {
                    const chosen = answers[key] === o.id;
                    const isAnswer = submitted && o.id === q.answer;
                    const wrongChosen = submitted && chosen && o.id !== q.answer;
                    return (
                      <label
                        key={o.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                          isAnswer ? "border-almi-teal bg-almi-teal/10" : wrongChosen ? "border-almi-coral-deep bg-almi-coral/10" : chosen ? "border-almi-coral" : "border-almi-line"
                        }`}
                      >
                        <input
                          type="radio"
                          name={key}
                          value={o.id}
                          checked={chosen}
                          disabled={submitted}
                          onChange={() => setAnswers((a) => ({ ...a, [key]: o.id }))}
                        />
                        <span className="text-almi-text">{o.text}</span>
                      </label>
                    );
                  })}
                </div>
                {submitted && it.guidanceNote && <p className="mt-1 text-xs text-almi-text-muted">Coach: {it.guidanceNote}</p>}
              </fieldset>
            );
          })}
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          className="rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark"
        >
          Check my answers
        </button>
      ) : (
        <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
          <div className="flex items-baseline justify-between">
            <p className="font-semibold text-almi-ink">{TRACK_LABEL[track]} · {SECTION_LABEL[section]} practice</p>
            <span className="rounded-full bg-almi-bg-peach px-3 py-1 text-xs text-almi-text">practice estimate</span>
          </div>
          <p className="mt-3 text-almi-text">
            Raw: <strong className="text-almi-ink">{correct}/{total}</strong> correct ({pct}%).
          </p>
          <p className="mt-3 text-xs text-almi-text-muted">
            This is a single-section practice read-out. TOPIK has no section minimums — everything you earn here counts toward your
            track total, and your level is decided by that total alone. Only NIIED&apos;s official sitting awards a level.
          </p>
        </div>
      )}
    </div>
  );
}
