# AlmiKorean

Honest TOPIK practice — TOPIK I (levels 1–2) and TOPIK II (levels 3–6).

Live at **[almikorean.almiworld.com](https://almikorean.almiworld.com)**. The 16th product in the
AlmiWorld network.

---

## What makes this product's scoring correct

TOPIK is not scored like most exams, and most of the awkward decisions in this repo come from
one fact:

> **There are no sectional minimums.** Your level is decided by the TOTAL alone. A strong
> section genuinely carries a weak one, and `TOPIK_I: WRITING = 0` is correct — TOPIK I has no
> Writing paper at all.

Two more, because they are easy to get wrong:

- **Two separate registrations, not a ladder.** You can sit TOPIK II without ever sitting
  TOPIK I. The tracks are parallel, not sequential.
- **Nobody "fails".** You are awarded a level, or you are awarded none. The product never uses
  the word, and results are valid for two years.

Only NIIED awards a real result. Everything this product shows is a **practice estimate** and
says so where it is shown.

## Layout

| Path | What lives there |
|---|---|
| `src/lib/items.ts` | The bank loader, `stableItemId`, and `toRunnerItem` — the type boundary that strips answer keys before anything reaches a browser |
| `src/lib/topik/scoring.ts` | Total → level. Plain arithmetic, no IRT, no invented scaling |
| `src/lib/topik/grade-attempt.ts` | Server-authoritative marking for objective sections |
| `src/lib/topik/writing-grader.ts` | AI criteria feedback for Writing Tasks 51–54 |
| `src/lib/topik/shuffle.ts` | Deterministic per-question option shuffle, seeded `title:questionId` |
| `src/lib/access.ts` | Access tiers and the paywall — **read the warning at the top before quoting it** |
| `src/data/items-batch1.json` | **GENERATED. Do not edit.** |
| `scripts/seed/raw/*.json` | The real source of the bank |
| `scripts/audio/` | MeloTTS render pipeline for the listening clips |

### The bank is generated

`src/data/items-batch1.json` is emitted by `scripts/seed/build-batch1.mjs` from
`scripts/seed/raw/*.json`. Editing the generated file appears to work and is silently reverted
on the next build. Edit the raw source, then:

```bash
npm run build:batch1
```

## Getting started

```bash
npm install
cp .env.example .env.local     # then fill in DATABASE_URL at minimum
npm run dev
```

Every variable the code reads is documented in `.env.example`. The product degrades honestly
when optional ones are absent: no Stripe keys → no paywall is shown and no checkout is offered;
no `ANTHROPIC_API_KEY` → Writing feedback returns a 503 rather than a fabricated score.

## Gates and proofs

`npm run build` runs four content gates **before** `next build`, so a violation blocks the
build rather than being reported after the fact:

| Command | What it refuses to let through |
|---|---|
| `npm run gate:item-id` | Two bank items hashing to one stable id — the seed would merge them and grading would key against the wrong item |
| `npm run gate:answer-position` | The answer clustering in a guessable position, measured on **served** (post-shuffle) order — what a learner actually sees |
| `npm run gate:audio` | A listening item with no playable clip |
| `scripts/fork-hygiene-gate.mjs` | Ancestor-product nouns left behind by the fork |

Two offline proofs run the **real** route handlers with auth, the database and the Anthropic
client stubbed at module-resolve. No database, no network, no key, no spend:

```bash
npm run proof:grade-integrity   # marking is server-authoritative; no key reaches the client
npm run proof:writing-grader    # the Writing guard ladder, band arithmetic and reply validation
```

Each gate has a RED mode, because a gate nobody has seen fail is not evidence:

```bash
npm run gate:item-id:red
npm run gate:answer-position:red   # measures AUTHORED order — the leak the shuffle fixed
```

## Audio

The 36 listening clips are rendered with MeloTTS and hosted on Vercel Blob. The app reads the
**committed** manifest at `src/data/audio-manifest.json`, not the database, so the coverage gate
can run inside a build that never opens a connection. See `docs/AUDIO.md` to re-render or
re-upload.

## Deploying

Vercel, from `master`. `npm run build` must be green — all four gates run first, so a red gate
is a failed deploy, which is the point.
