-- AlterTable: idempotency key for XP grants (lib/gamification/xp.ts#awardXp)
ALTER TABLE "activity_log_entries" ADD COLUMN "key" TEXT;
CREATE UNIQUE INDEX "activity_log_entries_key_key" ON "activity_log_entries"("key");

-- AlterTable: idempotency key for certificate issuance (lib/gamification/certificates.ts)
ALTER TABLE "certificates" ADD COLUMN "sourceKey" TEXT;
CREATE UNIQUE INDEX "certificates_sourceKey_key" ON "certificates"("sourceKey");

-- AlterTable: needed for the daily connection-XP cap and the 48h first-message bonus window
ALTER TABLE "connections" ADD COLUMN "acceptedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "session_attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "activeSeconds" INTEGER NOT NULL DEFAULT 0,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "suivi" BOOLEAN NOT NULL DEFAULT false,
    "lastHeartbeatAt" TIMESTAMP(3),

    CONSTRAINT "session_attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "session_attendance_userId_sessionId_key" ON "session_attendance"("userId", "sessionId");

ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "program_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "resource_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "secondsSpent" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3),

    CONSTRAINT "resource_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resource_reads_userId_resourceId_key" ON "resource_reads"("userId", "resourceId");

ALTER TABLE "resource_reads" ADD CONSTRAINT "resource_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "resource_reads" ADD CONSTRAINT "resource_reads_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "presence_days" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "generalSeconds" INTEGER NOT NULL DEFAULT 0,
    "generalXpAwarded" INTEGER NOT NULL DEFAULT 0,
    "lastHeartbeatAt" TIMESTAMP(3),

    CONSTRAINT "presence_days_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "presence_days_userId_day_key" ON "presence_days"("userId", "day");

ALTER TABLE "presence_days" ADD CONSTRAINT "presence_days_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "posters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posters_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "posters" ADD CONSTRAINT "posters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
