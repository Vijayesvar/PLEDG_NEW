-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'pending', 'paused', 'rejected');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'pending';
