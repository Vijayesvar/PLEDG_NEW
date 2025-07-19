/*
  Warnings:

  - You are about to drop the column `kyc_status` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "kyc_status",
ADD COLUMN     "email_registered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kyc_bank_status" "KycStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "kyc_basic_status" "KycStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "kyc_overall_status" "KycStatus" NOT NULL DEFAULT 'pending';
