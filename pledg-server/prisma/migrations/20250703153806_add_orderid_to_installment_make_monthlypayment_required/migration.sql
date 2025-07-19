/*
  Warnings:

  - Made the column `monthly_payment` on table `loans` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "installments" ADD COLUMN     "order_id" TEXT;

-- AlterTable
ALTER TABLE "loans" ALTER COLUMN "monthly_payment" SET NOT NULL;
