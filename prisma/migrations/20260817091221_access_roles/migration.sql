-- CreateEnum
CREATE TYPE "AccessRole" AS ENUM ('admin', 'delegate');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accessRole" "AccessRole" NOT NULL DEFAULT 'delegate';
