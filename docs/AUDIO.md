# Listening audio — render, upload, serve

TOPIK listening clips are rendered **once, offline** and served from Vercel Blob. Pattern B,
ported from `almi-pte`. The alternative in this network — French/Spanish/Goethe/TOEFL — synthesises
from `audioScript` on every request via OpenAI TTS and stores nothing, which costs a call per play.
These clips are fixed content, identical for every learner, so paying per play buys nothing.

## Why not the browser's Web Speech API (what this replaced)

The player used to drive `SpeechSynthesis` with the device's own ko-KR voice. Three faults a
listening test cannot carry:

1. **No Korean voice, no audio.** It printed the transcript instead — silently converting a
   listening item into a reading one, without telling the learner the construct had changed.
2. **Every learner heard something different.** The voice came from the device, so Windows, Mac
   and Android users sat different exams.
3. **The authored gender mapping was dead.** `payload.speakers[]` declared male/female per role
   and nothing read it; voices were assigned by order of appearance, so a 여자 line could be
   spoken by a male voice — which breaks any question asking who said what.

## Pipeline

```
scripts/audio/synth-listening.py --all     # MeloTTS -> .audio-wav/ -> .audio-mp3/  (both gitignored)
npx tsx scripts/audio/upload-blob.mts --dry-run
npx tsx scripts/audio/upload-blob.mts      # needs BLOB_READ_WRITE_TOKEN
npx tsx scripts/audio-coverage-gate.ts     # must be 36/36
```

The renderer needs a **Python 3.11** env (MeloTTS pins numpy 1.26.4, which has no 3.13 Windows
wheel) with `MeloTTS`, `librosa`, `soundfile`, `soxr`, `imageio-ffmpeg`, `kiwipiepy`.

### Two things that will bite whoever runs this next

**The Korean G2P needs a morphological analyser that will not install on Windows.** `g2pkk` calls
MeCab-ko in exactly one place and insists on `eunjeon`, which ships no wheel and needs MSVC.
`scripts/audio/kiwi_mecab_shim.py` puts `kiwipiepy` behind the same `.pos()` interface. This
matters more than it looks: `annotate()` returns the text **unannotated** whenever its tokens fail
to reconstruct the input, so a shim that appears to work can still drop every 의→에 and 경음화
rule with nothing raised. The reconstruction rate is therefore measured and written into
`readings-report.json` — currently **194/194 sentences**.

**MeloTTS ships exactly one Korean voice and it is female (~210 Hz).** Male turns are that voice
with pitch *and* formants shifted down 7 semitones, then time-stretched back to tempo. Chosen by
measurement: -3/-4/-5 land at 183/172/164 Hz, all above the 85–155 Hz male speaking range and
still read female; -7 lands at ~145 Hz. Formant-preserving `pitch_shift` was tried and rejected —
it gives the same woman speaking low. The cost is phase-vocoder smearing on plosives.

## Gender mapping

The **line prefix decides**, not `speakers[]`. For all 18 TOPIK_II items the `speakers[].role`
keys (안내원, 승객, 역무원, 기상 캐스터) never match the script prefixes (남자:/여자:), so keying on
the role would have failed to resolve on that entire half and read both parts in one voice.
Verified: 90/90 turns resolved by prefix, and the resulting genders agree with the authored
`speakers[].voice` on 18/18 TOPIK_II items.

## Where the URL lives, and why in two places

| | written by | read by |
|---|---|---|
| `src/data/audio-manifest.json` | `upload-blob.mts` | the build gate, and `toRunnerItem` |
| `KoreanItem.audioUrl/voice/durationSec` | `upload-blob.mts --db` | server-side / future audio route |

The gate must run inside `npm run build`, and this build is deliberately DB-free — Vercel runs
`prisma generate && next build` with no connection. A gate needing `DATABASE_URL` would be skipped
on CI or make every build depend on Neon being up, and a gate that gets skipped is not a gate. So
the committed manifest is the build-time truth; the column is parity for server-side use.

The Blob key is the **stable item id** (`sha256({track, section, title})`), not `KoreanItem.id` —
that is a cuid minted at seed time and would change if the table were ever re-seeded, breaking
every URL. `addRandomSuffix` is off and `allowOverwrite` on, so re-running the upload replaces the
same object instead of littering the store with orphans nobody can match back to an item.

## Deferred — needs the founder

1. `npx prisma migrate deploy` to apply `4_listening_audio` (three nullable columns, additive).
2. Create the Blob store, then run the upload with `BLOB_READ_WRITE_TOKEN` in the environment.
   The script never creates, guesses, prints or persists a credential.
3. Commit the filled manifest; the coverage gate turns green and the build passes.
