"use client";

import { useState } from "react";

// The rendered TOPIK listening clip.
//
// ── WHAT THIS REPLACED, AND WHY ────────────────────────────────────────────────
// This component used to drive the browser's Web Speech API (SpeechSynthesis, ko-KR). That
// was free and needed no files, but it had three faults that a listening test cannot carry:
//
//   1. NO KOREAN VOICE, NO AUDIO. When the device had no ko-KR voice it printed the full
//      transcript instead — silently turning a listening item into a reading one. The learner
//      was not told the construct had changed.
//   2. EVERY LEARNER HEARD SOMETHING DIFFERENT. The voice came from the device, so a Windows
//      user, a Mac user and an Android user sat different exams.
//   3. THE AUTHORED GENDER MAPPING WAS DEAD. payload.speakers[] declared male/female per role
//      and nothing read it — voices were assigned by order of appearance, so a 여자 line could
//      be spoken by a male voice, which breaks any question that asks who said what.
//
// The clip is now rendered once, offline, by MeloTTS (MIT) and served from Vercel Blob. Same
// audio for everyone, gender fixed at render time from the line prefix, $0 per play.
//
// ── REPLAY IS ALLOWED, ON PURPOSE ──
// The real TOPIK plays each clip once. An earlier version of the landing copy promised that and
// the mock enforced it. Enforcing it in a practice tool punishes a slow connection and a
// misheard first second — neither of which is the skill being examined. Native <audio controls>
// gives play/pause/seek/replay, and the copy says so.
//
// ── THE TRANSCRIPT STAYS SHUT ──
// It is behind a button and closed by default. Showing it is the same defect as the old
// fallback: it converts the item into a reading task. It is here because a learner who has
// already listened has a real reason to check what they missed.

export function ListeningAudio({
  url,
  transcript,
  durationSec,
}: {
  url?: string;
  transcript?: string;
  durationSec?: number;
}) {
  const [showText, setShowText] = useState(false);

  // Null clip is a real state, not an error: the manifest is filled by the Blob upload, and
  // before that runs there is genuinely nothing to play. Say that, rather than render a dead
  // control the learner will press and mistrust.
  if (!url) {
    return (
      <div className="mb-3 rounded-xl border border-dashed border-almi-line bg-almi-bg-peach/30 p-4 text-sm text-almi-text">
        <p className="font-medium text-almi-ink">Audio for this item isn&apos;t available yet.</p>
        <p className="mt-1 text-xs text-almi-text-muted">
          The questions below still work. Use the transcript if you want to attempt it as a reading task —
          but that is not what this section measures.
        </p>
        {transcript ? (
          <>
            <button
              type="button"
              onClick={() => setShowText((v) => !v)}
              className="mt-2 text-sm font-semibold text-almi-coral hover:underline"
            >
              {showText ? "Hide transcript" : "Show transcript"}
            </button>
            {showText ? <p className="mt-2 whitespace-pre-line text-sm text-almi-text">{transcript}</p> : null}
          </>
        ) : null}
      </div>
    );
  }

  const mins = durationSec ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}` : null;

  return (
    <div className="mb-3 rounded-xl border border-almi-line bg-almi-bg-peach/30 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden className="text-lg">🎧</span>
        <audio
          controls
          preload="none"
          src={url}
          className="min-h-[40px] flex-1"
          aria-label="Listening clip"
        >
          Your browser cannot play audio — use the transcript below.
        </audio>
        {transcript ? (
          <button
            type="button"
            onClick={() => setShowText((v) => !v)}
            className="text-sm font-semibold text-almi-coral hover:underline"
          >
            {showText ? "Hide transcript" : "Show transcript"}
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-almi-text-muted">
        Replay as often as you like{mins ? ` · ${mins}` : ""}. The real test plays each clip once — the transcript is
        here for after you have listened, not instead of it.
      </p>
      {showText && transcript ? (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-almi-paper p-3 text-sm text-almi-text">{transcript}</p>
      ) : null}
    </div>
  );
}
