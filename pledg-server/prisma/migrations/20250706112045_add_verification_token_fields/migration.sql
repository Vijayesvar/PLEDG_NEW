-- AlterTable
ALTER TABLE "users" ADD COLUMN     "verification_token" VARCHAR(255),
ADD COLUMN     "verification_token_expires_at" TIMESTAMP(3);
