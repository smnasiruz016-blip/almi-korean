# Render every TOPIK listening clip with a LOCAL MeloTTS (MIT, CPU, no key, no per-play cost).
#
#   python scripts/audio/synth-listening.py --sample   (3 representative items)
#   python scripts/audio/synth-listening.py --all
#
# Needs a Python 3.11 env with MeloTTS + librosa + kiwipiepy (see docs/AUDIO.md). Writes WAV to
# .audio-wav/ (gitignored) and the committed MP3s to public/audio/ko/.
#
# ── WHAT THIS PIPELINE HAS TO GET RIGHT, AND WHY ────────────────────────────────
#
# 1. THE GENDER SIGNAL IS THE LINE PREFIX, NOT speakers[].
#    Every item declares payload.speakers[] as {role, voice}. For TOPIK_I the role matches the
#    script's line prefix and either source works. For ALL 18 TOPIK_II items it does NOT: the
#    scripts are prefixed 남자:/여자: (TOPIK's own convention) while speakers[] names semantic
#    roles — 안내원, 승객, 역무원, 기상 캐스터. Keying on speakers[].role would have failed to
#    resolve on the entire TOPIK_II half and silently read both parts in one voice, which is
#    not a listening test: telling the speakers apart IS the skill.
#    So the prefix decides, and speakers[] is the fallback for the single-speaker items that
#    carry no prefix at all. Both paths are counted and reported.
#
# 2. MeloTTS SHIPS EXACTLY ONE KOREAN VOICE, AND IT IS FEMALE (~210 Hz).
#    Male turns are an approximation: pitch AND formants shifted down together by 7 semitones,
#    then time-stretched back to the original tempo. Formant-preserving pitch_shift was tried
#    and rejected — it gives the same woman speaking low, because male/female timbre is mostly
#    formant spacing. -7 st was chosen by measurement, not feel: -3/-4/-5 land at 183/172/164 Hz,
#    all ABOVE the 85-155 Hz male speaking range, and still read female. -7 lands at ~145 Hz.
#    The cost is phase-vocoder smearing on plosives, which is the known artifact.
#
# 3. THE KOREAN G2P NEEDS A MORPHOLOGICAL ANALYSER, AND THE DEFAULT ONE WILL NOT INSTALL.
#    g2pkk calls a MeCab-ko in exactly one place (utils.annotate) and on Windows insists on
#    `eunjeon`, which ships no wheel and needs MSVC. kiwi_mecab_shim.py puts kiwipiepy behind
#    the same .pos() interface. This matters more than it looks: annotate() silently returns
#    the text UNANNOTATED unless the tokens reconstruct the input, so a shim that "works" can
#    still drop every 의->에 and 경음화 rule with nothing raised. The reconstruction rate is
#    therefore measured per sentence and written into the readings report.
#
# 4. TOPIK_I IS READ SLOWER.
#    Beginner audio at 0.9x, TOPIK_II at 1.0x — carried over from the browser-TTS rates the
#    player used before (0.85 / 0.95), kept as a pedagogical setting rather than a fix.

import argparse
import json
import os
import pathlib
import re
import subprocess
import sys
import time

import numpy as np
import soundfile as sf
import librosa

ROOT = pathlib.Path(__file__).resolve().parents[2]
BANK = ROOT / "src" / "data" / "items-batch1.json"
WAVDIR = ROOT / ".audio-wav"
# Pattern B (almi-pte precedent): the MP3s are uploaded to Vercel Blob and referenced by URL,
# so they are NOT committed. Both dirs are gitignored build artefacts.
OUT = pathlib.Path(os.environ.get("AUDIO_OUT", ROOT / ".audio-mp3"))
REPORT = pathlib.Path(__file__).parent / "readings-report.json"

MALE_SEMITONES = 7.0
GAP_S = 0.45
BITRATE = "48k"
SPEED = {"TOPIK_I": 0.9, "TOPIK_II": 1.0}
SAMPLE_TITLES = [
    "TII-L-01-announcement-library-hours",
    "TII-L-07-lecture-sleep-health",
    "TII-L-02-dialogue-lost-item",
]

TURN = re.compile(r"^([^:：]{1,14})[:：]\s*(.+)$")


def split_turns(script):
    """(role|None, text) per spoken turn. A line with no prefix continues the previous turn."""
    turns = []
    for raw in script.split("\n"):
        line = raw.strip()
        if not line:
            continue
        m = TURN.match(line)
        if m:
            turns.append([m.group(1).strip(), m.group(2).strip()])
        elif turns:
            turns[-1][1] += " " + line
        else:
            turns.append([None, line])
    return [(r, t) for r, t in turns]


def gender_for(role, speakers):
    """Returns (gender, how) — `how` is recorded so the report can prove which source decided."""
    if role:
        if "남" in role:
            return "male", "prefix"
        if "여" in role:
            return "female", "prefix"
        for s in speakers or []:
            if s.get("role") == role:
                return s.get("voice", "female"), "speakers[]"
    if speakers:
        return speakers[0].get("voice", "female"), "speakers[]"
    return "female", "default"


def deepen(y, sr, semitones):
    """Pitch + formants down together, then tempo restored. See note 2 above."""
    if not semitones:
        return y
    r = 2.0 ** (-abs(semitones) / 12.0)
    y_deep = librosa.resample(y, orig_sr=int(sr * r), target_sr=sr, res_type="soxr_hq")
    return librosa.effects.time_stretch(y_deep, rate=1.0 / r)


def f0_of(y, sr):
    try:
        f0, _, _ = librosa.pyin(y, fmin=60, fmax=400, sr=sr, frame_length=2048)
        v = f0[~np.isnan(f0)]
        return round(float(np.median(v)), 1) if len(v) else None
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--sample", action="store_true")
    args = ap.parse_args()
    if not (args.all or args.sample):
        ap.error("pass --all or --sample")

    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    import kiwi_mecab_shim
    kiwi_mecab_shim.install()
    recon_ok, recon_total = kiwi_mecab_shim.reconstruction_stats(BANK)

    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    WAVDIR.mkdir(exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    bank = json.loads(BANK.read_text(encoding="utf-8"))
    items = [i for i in bank if i["section"] == "LISTENING"]
    if args.sample:
        items = [i for i in items if i["title"] in SAMPLE_TITLES]
    print(f"[bank] {len(items)} listening item(s) to render", flush=True)

    from melo.api import TTS
    t0 = time.time()
    model = TTS(language="KR", device="cpu")
    sid = model.hps.data.spk2id["KR"]
    print(f"[engine] MeloTTS KR loaded in {time.time()-t0:.1f}s", flush=True)

    report = []
    total_start = time.time()
    for n, it in enumerate(items, 1):
        title = it["title"]
        turns = split_turns(it["payload"]["audioScript"])
        speed = SPEED.get(it["track"], 1.0)
        pieces, meta = [], []
        sr_out = None
        t_item = time.time()
        for i, (role, text) in enumerate(turns):
            g, how = gender_for(role, it["payload"].get("speakers"))
            tmp = WAVDIR / f"_{title}_{i}.wav"
            model.tts_to_file(text, sid, str(tmp), speed=speed, quiet=True)
            y, sr = sf.read(str(tmp))
            if y.ndim > 1:
                y = y.mean(axis=1)
            y = y.astype(np.float32)
            if g == "male":
                y = deepen(y, sr, MALE_SEMITONES)
            meta.append({"turn": i + 1, "role": role, "gender": g, "source": how,
                         "chars": len(text), "f0": f0_of(y, sr)})
            pieces.append(y)
            pieces.append(np.zeros(int(sr * GAP_S), dtype=np.float32))
            sr_out = sr
            tmp.unlink(missing_ok=True)

        audio = np.concatenate(pieces)
        audio = (audio / (float(np.max(np.abs(audio))) or 1.0)) * 0.89
        wav = WAVDIR / f"{title}.wav"
        sf.write(str(wav), audio, sr_out)
        mp3 = OUT / f"{title}.mp3"
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", str(wav),
                        "-ac", "1", "-b:a", BITRATE, "-codec:a", "libmp3lame", str(mp3)], check=True)
        dur = len(audio) / sr_out
        genders = [m["gender"] for m in meta]
        print(f"[{n:>2}/{len(items)}] {title:<44} {len(turns)}t {dur:>5.1f}s "
              f"[{'/'.join(sorted(set(genders)))}] {time.time()-t_item:>5.1f}s", flush=True)
        report.append({
            "title": title, "track": it["track"], "turns": len(turns),
            "seconds": round(dur, 1), "mp3_bytes": mp3.stat().st_size,
            "genders": genders, "gender_source": sorted({m["source"] for m in meta}),
            "detail": meta,
        })

    total_audio = sum(r["seconds"] for r in report)
    total_bytes = sum(r["mp3_bytes"] for r in report)
    elapsed = time.time() - total_start
    REPORT.write_text(json.dumps({
        "engine": "MeloTTS KR (MIT)",
        "male_shift_semitones": MALE_SEMITONES,
        "bitrate": BITRATE,
        "g2p_annotation_reconstruction": {"ok": recon_ok, "total": recon_total},
        "items": len(report),
        "total_seconds": round(total_audio, 1),
        "total_mp3_bytes": total_bytes,
        "clips": report,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n[done] {len(report)} clip(s) · {total_audio:.0f}s audio · "
          f"{total_bytes/1024/1024:.2f} MB · rendered in {elapsed/60:.1f} min", flush=True)
    print(f"[g2p] phonological annotation reconstructed {recon_ok}/{recon_total} sentences", flush=True)
    print(f"[report] {REPORT}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
