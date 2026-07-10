-- Comp audit trail (restore AlmiPrep parity): who granted the comp, when, and why.
ALTER TABLE "User" ADD COLUMN "compGrantedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "compGrantedBy" TEXT;
ALTER TABLE "User" ADD COLUMN "compReason" TEXT;
