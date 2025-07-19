/*
  Warnings:

  - You are about to drop the column `locked_value_inr` on the `collaterals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "collaterals" DROP COLUMN "locked_value_inr",
ALTER COLUMN "locked_tx_hash" DROP NOT NULL;
