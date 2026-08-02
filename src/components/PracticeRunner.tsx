"use client";

import { useMemo, useState } from "react";
import { ListeningAudio } from "@/components/ListeningAudio";
import { shuffledOptions } from "@/lib/topik/shuffle";
import { asGraded, errorFrom, type Graded } from "@/lib/topik/graded-response";
import type { RunnerItem } from "@/lib/items";
import type { TopikTrack, TopikSkill } from "@prisma/client";

const SECTION_LABEL: Record<TopikSkill, string> = { LISTENING: "Listening", READING: "Reading", WRITING: "Writing" };
const TRACK_LABEL: Record<TopikTrack, string> = { TOPIK_I: "TOPIK I", TOPIK_II: "TOPIK II" };

// Objective sections only (Listening / Reading). Writing uses WritingComposer.
export function PracticeRunner({ items, track, section }: { items: RunnerItem[]; track: TopikTrack; section: TopikSkill }) {
  const flat = useMemo(
    () => items.flatMap((it) => it.payload.questions.map((q) => ({ key: `${it.id}:${q.id}`, item: it, q }))),
    [items]
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState<Graded | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = flat.length;
  const submitted = graded !== null;
  // Correctness is whatever the SERVER said. There is no local copy of the key to compare
  // against, and nothing here recomputes a mark — that is the whole point of the change.
  const markOf = (itemId: string, questionId: string) =>
    graded?.marks.find((m) => m.itemId === itemId && m.questionId === questionId) ?? null;

  async function submit() {
    if (busy || submitted) return;
    setBusy(true);
    setError(null);
    // Only item ids and the option chosen per question. No key, no score, no track or
    // section — the server derives all of that from the items it loads.
    const payload = {
      items: items.map((it) => ({
        itemId: it.id,
        answers: Object.fromEntries(
          it.payload.questions
            .map((q) => [q.id, answers[`${it.id}:${q.id}`]] as const)
            .filter(([, v]) => typeof v === "string")
        ) as Record<string, string>,
      })),
    };
    try {
      const res = await fetch("/api/ko/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Checked, not cast — see lib/topik/graded-response.ts.
      const raw: unknown = await res.json();
      const data = asGraded(raw);
      if (!res.ok || !data) setError(errorFrom(raw, "Could not mark this set right now."));
      else setGraded(data);
    } catch {
      setError("Could not reach the marking service.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      {items.map((it) => (
        <div key={it.id} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
          {/* Guarded on the SECTION, not on the transcript: the clip is the item, and a missing
              transcript must not make the audio disappear with it. */}
          {it.section === "LISTENING" && (
            <ListeningAudio url={it.payload.audioUrl} transcript={it.payload.audioScript} durationSec={it.payload.durationSec} />
          )}
          {it.payload.passages?.map((p) => (
            <p key={p.id} className="mb-3 whitespace-pre-line rounded-lg bg-almi-bg-peach/30 p-3 text-sm text-almi-text">{p.body}</p>
          ))}
          {it.payload.questions.map((q) => {
            const key = `${it.id}:${q.id}`;
            const mark = markOf(it.id, q.id);
            // Rendered order is decided here, not in the bank — see lib/topik/shuffle.ts.
            // The server marks by option id, so any permutation is safe.
            const opts = shuffledOptions(it.title, q.id, q.options);
            return (
              <fieldset key={q.id} className="mb-3">
                <legend className="text-sm font-medium text-almi-ink">{q.stem}</legend>
                <div className="mt-2 grid gap-1.5">
                  {opts.map((o) => {
                    const chosen = answers[key] === o.id;
                    // Both of these used to compare against a key that shipped with the
                    // question. They now read the server's mark, which exists only after the
                    // section has been submitted.
                    const isAnswer = mark !== null && o.id === mark.correctOptionId;
                    const wrongChosen = mark !== null && chosen && o.id !== mark.correctOptionId;
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

      {error && <p role="alert" className="rounded-xl bg-almi-coral/10 px-4 py-3 text-sm text-almi-coral-deep">{error}</p>}

      {!submitted ? (
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark disabled:opacity-40"
        >
          {busy ? "Marking…" : "Check my answers"}
        </button>
      ) : (
        <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
          <div className="flex items-baseline justify-between">
            <p className="font-semibold text-almi-ink">{TRACK_LABEL[track]} · {SECTION_LABEL[section]} practice</p>
            <span className="rounded-full bg-almi-bg-peach px-3 py-1 text-xs text-almi-text">practice estimate</span>
          </div>
          <p className="mt-3 text-almi-text">
            Raw: <strong className="text-almi-ink">{graded.correct}/{graded.total}</strong> correct ({graded.percent}%).
          </p>
          <p className="mt-3 text-xs text-almi-text-muted">
            This is a single-section practice read-out, marked on the server. TOPIK has no section minimums — everything you earn
            here counts toward your track total, and your level is decided by that total alone. Only NIIED&apos;s official sitting
            awards a level.
          </p>
        </div>
      )}
      {!submitted && <p className="text-xs text-almi-text-muted">{total} question{total === 1 ? "" : "s"} · {SECTION_LABEL[section].toLowerCase()}</p>}
    </div>
  );
}
