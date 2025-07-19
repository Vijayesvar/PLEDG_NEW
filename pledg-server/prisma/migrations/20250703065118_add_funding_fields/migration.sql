-- AlterEnum
ALTER TYPE "LoanStatus" ADD VALUE 'funding_pending';

-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "funding_order_id" TEXT,
ADD COLUMN     "funding_tx_hash" VARCHAR(66);
