-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TopikTrack" AS ENUM ('TOPIK_I', 'TOPIK_II');

-- CreateEnum
CREATE TYPE "TopikSkill" AS ENUM ('LISTENING', 'READING', 'WRITING');

-- CreateEnum
CREATE TYPE "TopikTaskType" AS ENUM ('MCQ', 'MATCHING', 'ORDERING', 'CLOZE', 'WRITING');

-- CreateEnum
CREATE TYPE "TopikDifficulty" AS ENUM ('FOUNDATION', 'CORE', 'STRETCH');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'SCORED');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('PRACTICE_SET', 'MOCK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "targetTrack" "TopikTrack",
    "emailVerifiedAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionCurrentPeriodEnd" TIMESTAMP(3),
    "compProUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KoreanItem" (
    "id" TEXT NOT NULL,
    "track" "TopikTrack" NOT NULL,
    "section" "TopikSkill" NOT NULL,
    "taskType" "TopikTaskType" NOT NULL,
    "difficulty" "TopikDifficulty" NOT NULL DEFAULT 'CORE',
    "title" TEXT NOT NULL,
    "prompt" TEXT,
    "topicTag" TEXT,
    "guidanceNote" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KoreanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KoreanAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "track" "TopikTrack" NOT NULL,
    "section" "TopikSkill" NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "sessionId" TEXT,
    "response" JSONB,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KoreanAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KoreanSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "track" "TopikTrack" NOT NULL,
    "section" "TopikSkill",
    "currentDifficulty" "TopikDifficulty" NOT NULL DEFAULT 'CORE',
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KoreanSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE INDEX "KoreanItem_track_section_idx" ON "KoreanItem"("track", "section");

-- CreateIndex
CREATE UNIQUE INDEX "KoreanItem_track_section_title_key" ON "KoreanItem"("track", "section", "title");

-- CreateIndex
CREATE INDEX "KoreanAttempt_userId_track_idx" ON "KoreanAttempt"("userId", "track");

-- CreateIndex
CREATE INDEX "KoreanSession_userId_mode_idx" ON "KoreanSession"("userId", "mode");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KoreanAttempt" ADD CONSTRAINT "KoreanAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KoreanAttempt" ADD CONSTRAINT "KoreanAttempt_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "KoreanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KoreanAttempt" ADD CONSTRAINT "KoreanAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "KoreanSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KoreanSession" ADD CONSTRAINT "KoreanSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

