-- RR-399 A6: the AI cost ledger (same model as almi-oet's AICostLedger). Every AI call writes one row with its real token counts
-- and cost; the free-AI daily budget reads today's rows. Additive only: a new table, nothing else changes.
-- Written by hand (as 4_listening_audio); `prisma migrate diff` from the previous schema gives the same statements.
-- NOT applied at build time: the owner runs `npx prisma migrate deploy`.
CREATE TABLE IF NOT EXISTS "AICostLedger" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,

    CONSTRAINT "AICostLedger_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AICostLedger_timestamp_idx" ON "AICostLedger"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "AICostLedger_userId_timestamp_idx" ON "AICostLedger"("userId", "timestamp");
CREATE INDEX IF NOT EXISTS "AICostLedger_feature_timestamp_idx" ON "AICostLedger"("feature", "timestamp");
