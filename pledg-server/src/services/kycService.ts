import { search } from 'fast-fuzzy';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AadhaarOtpResponse {
  success: boolean;
  referenceId?: string;
  message: string;
}

interface AadhaarVerificationRequest {
  userId: string;
  aadhaarNumber: string;
  referenceId: string;
  otp: string;
  userData: {
    name: string;
    yearOfBirth: number;
    gender: string;
    email?: string;
    mobile?: string;
  };
}

interface AadhaarOtpApiResponse {
  code: number;
  timestamp: number;
  data: {
    "@entity": string;
    reference_id: number;
    message: string;
  };
  transaction_id: string;
}

interface AadhaarVerifyApiResponse {
  code: number;
  timestamp: number;
  data: {
    "@entity": string;
    reference_id: number;
    status: string;
    message: string;
    care_of: string;
    full_address: string;
    date_of_birth: string;
    email_hash: string;
    gender: string;
    name: string;
    address: {
      "@entity": string;
      country: string;
      district: string;
      house: string;
      landmark: string;
      pincode: string;
      post_office: string;
      state: string;
      street: string;
      subdistrict: string;
      vtc: string;
    };
    year_of_birth: number;
    mobile_hash: string;
    share_code: string;
  };
  transaction_id: string;
}

interface VerificationResult {
  success: boolean;
  message: string;
  requiresManualReview: boolean;
}

function validateAadhaarHash(
  value: string | undefined,
  hash: string | undefined,
  shareCode: string | undefined,
  referenceId: string | number | undefined,
  hashFn: (value: string | undefined, shareCode: string | undefined, repeat: number) => string
): boolean {
  if (
    typeof value !== 'string' ||
    typeof hash !== 'string' ||
    typeof shareCode !== 'string' ||
    typeof referenceId === 'undefined'
  ) {
    return false;
  }

  // Pad referenceId to 12 digits to ensure Aadhaar format
  const aadhaarNumber = referenceId.toString().padStart(12, '0');
  // Last digit of Aadhaar number determines the number of hash iterations
  const lastDigitChar = aadhaarNumber.charAt(aadhaarNumber.length - 1);
  const repeatCount = parseInt(lastDigitChar, 10) || 1; // If last digit is 0, repeat once

  // Compute the hash using the provided hash function
  const computedHash = hashFn(value, shareCode, repeatCount);

  // Compare the computed hash with the provided hash (from Aadhaar KYC)
  return computedHash === hash;
}


class KYCService {
  private readonly apiKey: string;
  private readonly accessToken: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env['KYC_API_KEY'] || '';
    this.accessToken = process.env['KYC_ACCESS_TOKEN'] || '';
    this.baseUrl = process.env['KYC_BASE_URL'] || 'https://api.sandbox.co.in';
  }

  async sendAadhaarOtp(userId: string, aadhaarNumber: string): Promise<AadhaarOtpResponse> {
    try {
      const url = `${this.baseUrl}/kyc/aadhaar/okyc/otp`;
      const headers = {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-version': '2.0',
        'x-api-key': this.apiKey,
        'Authorization': this.accessToken
      };

      const body = {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        "aadhaar_number": aadhaarNumber,
        "consent": "y",
        "reason": "For KYC"
      };

      const response = await axios.post(url, body, { headers });
      const apiResponse: AadhaarOtpApiResponse = response.data;

      if (apiResponse.code === 200) {
        const referenceId = apiResponse.data.reference_id;
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

        // Remove any existing session for this user and aadhaarNumber
        await prisma.aadhaarOtpSession.deleteMany({
          where: { userId, aadhaarNumber }
        });

        await prisma.aadhaarOtpSession.create({
          data: {
            userId,
            aadhaarNumber,
            referenceId: referenceId.toString(),
            expiresAt
          }
        });

        return {
          success: true,
          referenceId: referenceId.toString(),
          message: apiResponse.data.message
        };
      } else {
        return {
          success: false,
          message: apiResponse.data.message || 'Failed to send OTP'
        };
      }
    } catch (error) {
      console.error('Error sending Aadhaar OTP:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      }
      return {
        success: false,
        message: 'Failed to send OTP'
      };
    }
  }

  async verifyAadhaarKyc(request: AadhaarVerificationRequest): Promise<VerificationResult> {
    try {
      // Find OTP session
      const session = await prisma.aadhaarOtpSession.findFirst({
        where: {
          userId: request.userId,
          aadhaarNumber: request.aadhaarNumber,
          referenceId: request.referenceId
        }
      });
      if (!session || session.expiresAt < new Date()) {
        return {
          success: false,
          message: 'OTP session expired or not found',
          requiresManualReview: true
        };
      }

      const url = `${this.baseUrl}/kyc/aadhaar/okyc/otp/verify`;
      const headers = {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-version': '2.0',
        'x-api-key': this.apiKey,
        'Authorization': this.accessToken
      };

      const body = {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        "reference_id": request.referenceId,
        "otp": request.otp
      };

      const response = await axios.post(url, body, { headers });
      const apiResponse: AadhaarVerifyApiResponse = response.data;

      console.log("API RESPONSE:",apiResponse);

      if (apiResponse.code !== 200) {
        return {
          success: false,
          message: apiResponse.data.message || 'Verification failed',
          requiresManualReview: true
        };
      }

      const verificationResult = this.validateAadhaarData(apiResponse.data, request.userData);

      // Delete OTP session after verification attempt
      await prisma.aadhaarOtpSession.deleteMany({
        where: {
          userId: request.userId,
          aadhaarNumber: request.aadhaarNumber,
          referenceId: request.referenceId
        }
      });

      return verificationResult;
    } catch (error) {
      console.error('Error verifying Aadhaar KYC:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      }
      return {
        success: false,
        message: 'Verification failed',
        requiresManualReview: true
      };
    }
  }

  private validateAadhaarData(
    aadhaarData: AadhaarVerifyApiResponse['data'],
    userData: AadhaarVerificationRequest['userData']
  ): VerificationResult {
    if (aadhaarData.status !== 'VALID') {
      return {
        success: false,
        message: 'Aadhaar status is not valid',
        requiresManualReview: true
      };
    }

    let matchCount = 0;
    const totalFields = 5;
    const requiredMatches = 3;

    const matches = {
      yearOfBirth: false,
      gender: false,
      name: false,
      email: false,
      mobile: false
    };

    // Check year of birth
    if (aadhaarData.year_of_birth === userData.yearOfBirth) {
      matchCount++;
      matches.yearOfBirth = true;
      console.log("YEAR OF BIRTH MATCHED");
    }

    // Check gender
    const normalizedAadhaarGender = aadhaarData.gender === 'M' ? 'male' : 'female';
    const normalizedUserGender = userData.gender.toLowerCase();
    if (normalizedAadhaarGender === normalizedUserGender) {
      matchCount++;
      matches.gender = true;
      console.log("GENDER MATCHED");
    }

    // Check name using fuzzy matching
    const nameSimilarity = search(userData.name, [aadhaarData.name], { returnMatchData: true })[0]?.score || 0;
    if (nameSimilarity > 0.7) {
      matchCount++;
      matches.name = true;
      console.log("NAME MATCHED");
    }

    // Check email hash if available
    if (validateAadhaarHash(userData.email, aadhaarData.email_hash, aadhaarData.share_code, aadhaarData.reference_id, this.hashAadhaarField)) {
      matchCount++;
      matches.email = true;
      console.log("EMAIL MATCHED");
    }

    // Check mobile hash if available
    if (validateAadhaarHash(userData.mobile, aadhaarData.mobile_hash, aadhaarData.share_code, aadhaarData.reference_id, this.hashAadhaarField)) {
      matchCount++;
      matches.mobile = true;
      console.log("MOBILE MATCHED");
    }

    if (matchCount >= requiredMatches) {
      return {
        success: true,
        message: `KYC verification successful. Matched ${matchCount} out of ${totalFields} fields.`,
        requiresManualReview: false
      };
    } else {
      return {
        success: false,
        message: `KYC verification failed. Only ${matchCount} out of ${totalFields} fields matched. Requires manual review.`,
        requiresManualReview: true
      };
    }
  }

  private hashAadhaarField(value: string | undefined, shareCode: string | undefined, repeat: number): string {
    if (typeof value !== 'string' || typeof shareCode !== 'string') {
      return '';
    }
    const crypto = require('crypto');
    let input = `${value}${shareCode}`;
    let hash = Buffer.from(input, 'utf8');
    const times = repeat === 0 ? 1 : repeat;
    for (let i = 0; i < times; i++) {
      hash = crypto.createHash('sha256').update(hash).digest();
    }
    return hash.toString('hex');
  }

  async cleanupExpiredOtps(): Promise<void> {
    const now = new Date();
    await prisma.aadhaarOtpSession.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    });
  }
}

export const kycService = new KYCService(); 