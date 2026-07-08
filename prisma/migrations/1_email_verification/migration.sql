-- Email verification (network-standard parity with Goethe/CELPIP).
-- Adds the token-hash + expiry + last-sent columns to User and a unique index
-- on the token hash. `emailVerifiedAt` already exists on User.
ALTER TABLE "User" ADD COLUMN "emailVerificationTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailVerificationLastSentAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_emailVerificationTokenHash_key" ON "User"("emailVerificationTokenHash");
