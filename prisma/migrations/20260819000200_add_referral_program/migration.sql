-- AlterTable
ALTER TABLE "users" ADD COLUMN "referralCode" TEXT,
ADD COLUMN "referredById" TEXT;

-- Backfill: existing rows need a unique code before the column can be made required.
UPDATE "users" SET "referralCode" = upper(substr(md5(random()::text || "id"), 1, 8)) WHERE "referralCode" IS NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "referralCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
