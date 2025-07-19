-- CreateTable
CREATE TABLE "aadhaar_otp_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "aadhaar_number" VARCHAR(12) NOT NULL,
    "reference_id" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aadhaar_otp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aadhaar_otp_sessions_user_id_idx" ON "aadhaar_otp_sessions"("user_id");

-- CreateIndex
CREATE INDEX "aadhaar_otp_sessions_aadhaar_number_idx" ON "aadhaar_otp_sessions"("aadhaar_number");

-- CreateIndex
CREATE INDEX "aadhaar_otp_sessions_expires_at_idx" ON "aadhaar_otp_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "aadhaar_otp_sessions" ADD CONSTRAINT "aadhaar_otp_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
