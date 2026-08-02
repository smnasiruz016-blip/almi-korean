-- Listening audio (Pattern B: MeloTTS render → Vercel Blob → URL on the item row).
--
-- NOT YET APPLIED. Written by hand rather than by `migrate dev`, which needs a shadow database
-- and flakes against Neon (P3006/P1001). `npx prisma migrate deploy` applies it when the founder
-- is ready; nothing here runs at build time.
--
-- All three columns are NULLABLE and have no default, so this is additive and safe on a live
-- table: existing rows keep working, READING/WRITING rows stay NULL forever (they have no clip),
-- and the 18+18 LISTENING rows are filled by scripts/audio/upload-blob.mts after the upload.
-- No backfill statement is included on purpose — the URLs do not exist until the Blob upload has
-- run, and inventing them here would put a value in the database that resolves to nothing.

ALTER TABLE "KoreanItem" ADD COLUMN "voice" TEXT;
ALTER TABLE "KoreanItem" ADD COLUMN "audioUrl" TEXT;
ALTER TABLE "KoreanItem" ADD COLUMN "durationSec" INTEGER;
