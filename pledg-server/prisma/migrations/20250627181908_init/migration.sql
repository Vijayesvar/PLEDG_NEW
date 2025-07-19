-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "CollateralType" AS ENUM ('eth');

-- CreateEnum
CREATE TYPE "CollateralStatus" AS ENUM ('pending', 'locked', 'released', 'liquidated');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('draft', 'active', 'funded', 'repaying', 'completed', 'liquidated', 'disputed', 'cancelled');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('pending', 'paid', 'grace_period', 'overdue', 'defaulted');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('collateral_lock', 'funding', 'repayment', 'liquidation', 'collateral_release', 'fee', 'refund');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('inr', 'eth');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone_number" VARCHAR(15),
    "date_of_birth" DATE,
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bank_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "secure_token" VARCHAR(255) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaterals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "CollateralType" NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "remaining_amount" DECIMAL(18,8) NOT NULL,
    "locked_value_inr" DECIMAL(18,2) NOT NULL,
    "locked_tx_hash" VARCHAR(66) NOT NULL,
    "status" "CollateralStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaterals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "borrower_id" UUID NOT NULL,
    "lender_id" UUID,
    "collateral_id" UUID NOT NULL,
    "amount_inr" DECIMAL(18,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "monthly_payment" DECIMAL(18,2),
    "ltv" DECIMAL(5,2) NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "funded_at" TIMESTAMP(3),
    "disbursed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "loan_id" UUID NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "loan_id" UUID,
    "installment_id" UUID,
    "user_id" UUID,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "fiat_reference" VARCHAR(66),
    "blockchain_tx_hash" VARCHAR(66),
    "liquidated_collateral_amount" DECIMAL(18,8),
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bank_accounts" ADD CONSTRAINT "user_bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaterals" ADD CONSTRAINT "collaterals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_collateral_id_fkey" FOREIGN KEY ("collateral_id") REFERENCES "collaterals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "installments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
