"use client";

import { useEffect, useRef, useState } from "react";

// Free, client-side Korean listening audio via the Web Speech API (SpeechSynthesis) — no API key,
// no cost, no Blob (family TTS=browser pattern). Speaks the audioScript line by line, alternating
// ko-KR voices per speaker where the browser offers more than one. Falls back to the transcript
// when the browser has no Korean voice. A network TTS can replace this later without changing callers.

type Line = { role?: string; text: string };
function parseScript(script: string): Line[] {
  return script
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^([^:：]{1,14})[:：]\s*(.+)$/);
      return m ? { role: m[1].trim(), text: m[2].trim() } : { text: l };
    });
}

export function ListeningAudio({ script, rate = 0.95, playOnce = false }: { script: string; rate?: number; playOnce?: boolean }) {
  const [koVoices, setKoVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { setSupported(false); return; }
    const load = () => {
      const ko = window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("ko"));
      if (mounted.current) setKoVoices(ko);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      mounted.current = false;
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const hasKo = koVoices.length > 0;

  const play = () => {
    if (!hasKo) return;
    window.speechSynthesis.cancel();
    const lines = parseScript(script);
    const roles = [...new Set(lines.map((l) => l.role).filter(Boolean))] as string[];
    const roleVoice: Record<string, SpeechSynthesisVoice> = {};
    roles.forEach((r, i) => { roleVoice[r] = koVoices[i % koVoices.length]; });

    setState("playing");
    lines.forEach((ln, idx) => {
      const u = new SpeechSynthesisUtterance(ln.text);
      u.lang = "ko-KR";
      u.rate = rate;
      u.voice = (ln.role && roleVoice[ln.role]) || koVoices[0];
      if (idx === lines.length - 1) u.onend = () => { if (mounted.current) setState("done"); };
      window.speechSynthesis.speak(u);
    });
  };

  const stop = () => { window.speechSynthesis.cancel(); setState(playOnce ? "done" : "idle"); };

  if (!supported || !hasKo) {
    return (
      <div className="rounded-lg bg-almi-bg-peach/30 p-3 text-sm text-almi-text">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-almi-text-muted">
          {supported ? "No Korean voice in this browser — transcript shown" : "Audio not supported here — transcript shown"}
        </p>
        <p className="whitespace-pre-line">{script}</p>
      </div>
    );
  }

  const canPlay = state === "idle" || (state === "done" && !playOnce);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-almi-line bg-almi-paper p-3">
      <button
        onClick={play}
        disabled={!canPlay}
        className="rounded-full bg-almi-coral px-4 py-1.5 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state === "playing" ? "▶ Playing…" : state === "done" ? (playOnce ? "Played" : "🔊 Replay") : "🔊 Play audio"}
      </button>
      {state === "playing" && <button onClick={stop} className="text-sm text-almi-text-muted hover:text-almi-coral">Stop</button>}
      <span className="text-xs text-almi-text-muted">{playOnce ? "Plays once — just like test day." : "Korean audio (your device voice)."}</span>
    </div>
  );
}
