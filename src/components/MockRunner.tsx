"use client";

import { useMemo, useState } from "react";
import { scoreTopik, type TopikTrack, type TopikSection } from "@/lib/topik/scoring";
import { ListeningAudio } from "@/components/ListeningAudio";
import type { BankItem } from "@/lib/items";

const SECTION_LABEL: Record<TopikSection, string> = { LISTENING: "Listening", READING: "Reading", WRITING: "Writing" };
const TRACK_LABEL: Record<TopikTrack, string> = { TOPIK_I: "TOPIK I", TOPIK_II: "TOPIK II" };
const ORDER: Record<TopikTrack, TopikSection[]> = { TOPIK_I: ["LISTENING", "READING"], TOPIK_II: ["LISTENING", "WRITING", "READING"] };

type Bank = Partial<Record<TopikSection, BankItem[]>>;

// A shorter-than-real practice mock built from the available item bank. Objective sections
// auto-score to /100 by proportion correct; Writing is self-estimated against the shown criteria
// (AI criteria grading arrives later). The aggregate total → level comes from the REAL engine.
export function MockRunner({ track, bank }: { track: TopikTrack; bank: Bank }) {
  const sections = ORDER[track].filter((s) => (bank[s]?.length ?? 0) > 0 || s === "WRITING");
  const [step, setStep] = useState(0); // 0..sections.length-1 = a section; === length → results
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writingText, setWritingText] = useState("");
  const [writingEstimate, setWritingEstimate] = useState<number>(0);
  const [writingEstimated, setWritingEstimated] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const writingItem = bank.WRITING?.find((w) => w.payload.writing?.taskNumber === 54) ?? bank.WRITING?.[0];

  // per-objective-section score /100 (proportion correct)
  const objectiveScore = (section: TopikSection): { correct: number; total: number; score: number } => {
    const items = bank[section] ?? [];
    const flat = items.flatMap((it, i) => (it.payload.questions ?? []).map((q) => ({ key: `${section}:${i}:${q.id}`, ans: q.answer })));
    const correct = flat.filter((f) => answers[f.key] === f.ans).length;
    const total = flat.length;
    return { correct, total, score: total > 0 ? Math.round((correct / total) * 100) : 0 };
  };

  const result = useMemo(() => {
    if (step < sections.length) return null;
    const inputs = sections.map((s) => {
      if (s === "WRITING") return { section: "WRITING" as TopikSection, score: writingEstimated ? writingEstimate : 0 };
      return { section: s, score: objectiveScore(s).score };
    });
    return scoreTopik(track, inputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ---- results ----
  if (step >= sections.length && result) {
    const cheapest = result.sections.find((s) => s.section === result.cheapestGainSection);
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-almi-line bg-almi-paper p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <p className="font-semibold text-almi-ink">{TRACK_LABEL[track]} mock · {result.levelLabel}</p>
            <span className="rounded-full bg-almi-bg-peach px-3 py-1 text-xs text-almi-text">practice estimate</span>
          </div>
          <dl className="mt-4 space-y-2">
            {result.sections.map((s) => {
              const isWriting = s.section === "WRITING";
              const obj = isWriting ? null : objectiveScore(s.section);
              return (
                <div key={s.section} className="flex items-center justify-between text-sm">
                  <dt className="text-almi-text">
                    {SECTION_LABEL[s.section]}
                    {isWriting && <span className="ml-2 rounded bg-almi-bg-peach px-1.5 py-0.5 text-[10px] font-medium text-almi-text-muted">{writingEstimated ? "self-estimated" : "not estimated"}</span>}
                  </dt>
                  <dd className="tabular-nums text-almi-text-muted">
                    {obj ? `${obj.correct}/${obj.total} → ` : ""}{s.score}/{s.scaleMax}
                  </dd>
                </div>
              );
            })}
          </dl>
          <div className="mt-4 border-t border-almi-line pt-4 text-sm">
            <p className="text-almi-text">Total <span className="font-semibold text-almi-ink">{result.total}/{result.totalMax}</span> → <span className="font-semibold text-almi-teal">{result.levelLabel}</span></p>
            {cheapest && <p className="mt-2 text-almi-text">Points are cheapest for you in <span className="font-semibold text-almi-ink">{SECTION_LABEL[cheapest.section]}</span> ({cheapest.headroom} still available).</p>}
            <p className="mt-2 text-xs text-almi-text-muted">{result.honestyLine}</p>
          </div>
        </div>
        {track === "TOPIK_II" && !writingEstimated && (
          <p className="text-xs text-almi-text-muted">Your Writing wasn&apos;t self-estimated, so it counted as 0 toward the total. Real Writing is graded on official criteria — treat this level as a floor.</p>
        )}

        <button onClick={() => setShowReview((v) => !v)} className="text-sm font-medium text-almi-coral hover:underline">
          {showReview ? "Hide answer review" : "Show answer review"}
        </button>

        {showReview && (
          <div className="space-y-6">
            {sections.map((sec) =>
              sec === "WRITING" ? (
                <div key={sec} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Writing review</p>
                  {writingItem?.payload.writing && <p className="mt-2 whitespace-pre-line text-sm text-almi-text">{writingItem.payload.writing.prompt}</p>}
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-almi-text-muted">Your response ({Array.from(writingText.trim()).length} 자)</p>
                  <p className="mt-1 whitespace-pre-line rounded-lg bg-almi-bg-peach/30 p-3 text-sm text-almi-text">{writingText || "—"}</p>
                  <p className="mt-2 text-xs text-almi-text-muted">Writing isn&apos;t auto-marked — compare your response against the official criteria: content &amp; task fulfilment, organisation, and language use.</p>
                </div>
              ) : (
                <div key={sec} className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">{SECTION_LABEL[sec]} review</p>
                  {(bank[sec] ?? []).map((it, i) => (
                    <div key={i} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
                      {it.payload.audioScript && (
                        <div className="mb-3 rounded-lg bg-almi-bg-peach/30 p-3 text-sm text-almi-text">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-almi-text-muted">Transcript</p>
                          <p className="whitespace-pre-line">{it.payload.audioScript}</p>
                        </div>
                      )}
                      {it.payload.passages?.map((p) => (
                        <p key={p.id} className="mb-3 whitespace-pre-line rounded-lg bg-almi-bg-peach/30 p-3 text-sm text-almi-text">{p.body}</p>
                      ))}
                      {(it.payload.questions ?? []).map((q) => {
                        const key = `${sec}:${i}:${q.id}`;
                        return (
                          <fieldset key={q.id} className="mb-3">
                            <legend className="text-sm font-medium text-almi-ink">{q.stem}</legend>
                            <div className="mt-2 grid gap-1.5">
                              {q.options.map((o) => {
                                const chosen = answers[key] === o.id;
                                const isAnswer = o.id === q.answer;
                                const wrongChosen = chosen && !isAnswer;
                                return (
                                  <div key={o.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isAnswer ? "border-almi-teal bg-almi-teal/10" : wrongChosen ? "border-almi-coral-deep bg-almi-coral/10" : "border-almi-line"}`}>
                                    <span className="text-almi-text">{o.text}</span>
                                    {isAnswer && <span className="ml-auto shrink-0 text-xs font-semibold text-almi-teal">correct</span>}
                                    {wrongChosen && <span className="ml-auto shrink-0 text-xs font-semibold text-almi-coral-deep">your answer</span>}
                                  </div>
                                );
                              })}
                            </div>
                            {it.guidanceNote && <p className="mt-1 text-xs text-almi-text-muted">Coach: {it.guidanceNote}</p>}
                          </fieldset>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        <button onClick={() => { setStep(0); setAnswers({}); setWritingText(""); setWritingEstimate(0); setWritingEstimated(false); setShowReview(false); }} className="rounded-full border border-almi-line px-6 py-2.5 text-sm font-medium text-almi-ink hover:border-almi-coral">
          Restart mock
        </button>
      </div>
    );
  }

  // ---- a section step ----
  const section = sections[step];
  const isLast = step === sections.length - 1;
  const advance = () => setStep((s) => s + 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">{TRACK_LABEL[track]} mock · {SECTION_LABEL[section]} <span className="text-almi-text-muted">({step + 1}/{sections.length})</span></p>
      </div>

      {section === "WRITING" ? (
        <div className="rounded-2xl border border-almi-line bg-almi-paper p-5">
          {writingItem?.payload.writing ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-almi-coral">Task {writingItem.payload.writing.taskNumber}{writingItem.payload.writing.charMin ? ` · ${writingItem.payload.writing.charMin}–${writingItem.payload.writing.charMax}자` : ""}</p>
              <p className="mt-2 whitespace-pre-line text-almi-text">{writingItem.payload.writing.prompt}</p>
              <textarea value={writingText} onChange={(e) => setWritingText(e.target.value)} rows={10} placeholder="여기에 작성하세요…" className="mt-3 w-full resize-y rounded-lg border border-almi-line bg-almi-bg p-3 text-almi-ink focus:border-almi-coral focus:outline-none" />
              <p className="mt-1 text-sm tabular-nums text-almi-text-muted">{Array.from(writingText.trim()).length} 자</p>
              <div className="mt-4 rounded-lg bg-almi-bg-peach/30 p-3 text-sm">
                <p className="text-almi-text">Real Writing is graded by raters on official criteria; we don&apos;t auto-score it. Self-estimate your Writing out of 100 against those criteria to include it in your total:</p>
                <div className="mt-2 flex items-center gap-3">
                  <input type="range" min={0} max={100} value={writingEstimate} onChange={(e) => { setWritingEstimate(Number(e.target.value)); setWritingEstimated(true); }} className="flex-1" />
                  <span className="w-14 text-right tabular-nums font-semibold text-almi-ink">{writingEstimate}/100</span>
                </div>
                {!writingEstimated && <p className="mt-1 text-xs text-almi-text-muted">(optional — leave it and Writing counts as 0)</p>}
              </div>
            </>
          ) : (
            <p className="text-almi-text">Writing prompts arrive with Batch&nbsp;1.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(bank[section] ?? []).map((it, i) => (
            <div key={i} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
              {it.payload.audioScript && (
                <div className="mb-3">
                  <ListeningAudio script={it.payload.audioScript} playOnce rate={track === "TOPIK_I" ? 0.85 : 0.95} />
                </div>
              )}
              {it.payload.passages?.map((p) => (
                <p key={p.id} className="mb-3 whitespace-pre-line rounded-lg bg-almi-bg-peach/30 p-3 text-sm text-almi-text">{p.body}</p>
              ))}
              {(it.payload.questions ?? []).map((q) => {
                const key = `${section}:${i}:${q.id}`;
                return (
                  <fieldset key={q.id} className="mb-3">
                    <legend className="text-sm font-medium text-almi-ink">{q.stem}</legend>
                    <div className="mt-2 grid gap-1.5">
                      {q.options.map((o) => {
                        const chosen = answers[key] === o.id;
                        return (
                          <label key={o.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${chosen ? "border-almi-coral" : "border-almi-line"}`}>
                            <input type="radio" name={key} value={o.id} checked={chosen} onChange={() => setAnswers((a) => ({ ...a, [key]: o.id }))} />
                            <span className="text-almi-text">{o.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <button onClick={advance} className="rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
        {isLast ? "Finish & see my estimate" : `Next section: ${SECTION_LABEL[sections[step + 1]]}`}
      </button>
      <p className="text-xs text-almi-text-muted">A shorter run than the real exam, built from the practice bank. Scores are practice estimates — only NIIED&apos;s official sitting awards a level.</p>
    </div>
  );
}
