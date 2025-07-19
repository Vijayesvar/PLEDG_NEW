# Aadhaar KYC Implementation

## Overview

This implementation provides a two-step Aadhaar KYC verification process for the Pledg DeFi lending platform using the actual KYC provider API.

## Architecture

### MVP Version (Current)
- **Direct API Integration**: Immediate calls to KYC provider
- **Database OTP Storage**: Persistent storage using `AadhaarOtpSession` table
- **Synchronous Processing**: Real-time verification
- **Advanced Validation**: Fuzzy matching and hash comparison with 3/5 field requirement

### Production Version (Future)
- **Microservices**: Separate KYC service
- **Message Queues**: Redis/RabbitMQ for async processing
- **Redis Storage**: Distributed OTP storage with TTL
- **Webhook Handling**: Async response processing
- **Rate Limiting**: Fraud prevention
- **Comprehensive Logging**: Audit trails

## API Endpoints

### 1. Send Aadhaar OTP
```
POST /api/v1/auth/aadhaar/otp
```

**Request Body:**
```json
{
  "aadhaarNumber": "123456789012"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "referenceId": "55409183"
}
```

### 2. Verify Aadhaar KYC
```
POST /api/v1/auth/register/kyc
```

**Request Body:**
```json
{
  "referenceId": "55409183",
  "otp": "123456",
  "aadhaarNumber": "123456789012",
  "gender": "male"
}
```

**Success Response:**
```json
{
  "message": "KYC aadhar verified successfully",
  "details": "KYC verification successful. Matched 3 out of 5 fields."
}
```

**Manual Review Response:**
```json
{
  "message": "KYC verification requires manual review",
  "details": "KYC verification failed. Only 1 out of 5 fields matched. Requires manual review."
}
```

## Verification Logic

The system validates Aadhaar data by matching at least **3 out of 5 fields**:

1. **Year of Birth**: Exact match
2. **Gender**: Normalized comparison (M/F → male/female)
3. **Name**: Fuzzy matching with 70% similarity threshold
4. **Email Hash**: SHA-256 hash comparison
5. **Mobile Hash**: SHA-256 hash comparison

## Environment Variables

```env
KYC_ACCESS_TOKEN=your-kyc-provider-access-token
KYC_API_KEY=your-kyc-provider-api-key
KYC_BASE_URL=https://api.kycprovider.com
```

## KYC Provider API Integration

### Send OTP Request
```
POST /kyc/aadhaar/okyc/otp
Headers:
  Authorization: SANDBOX_ACCESS_TOKEN
  x-api-key: SANDBOX_API_KEY
  x-api-version: '2.0'
Body:
{
  "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
  "aadhaar_number": "123456789012",
  "consent": "y",
  "reason": "For KYC"
}
```

### Verify OTP Request
```
POST /kyc/aadhaar/okyc/otp/verify
Headers:
  Authorization: SANDBOX_ACCESS_TOKEN
  x-api-key: SANDBOX_API_KEY
  x-api-version: '2.0'
Body:
{
  "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
  "reference_id": "55409183",
  "otp": "123456"
}
```

### Example KYC Provider Response
```json
{
  "code": 200,
  "timestamp": 1751917182902,
  "data": {
    "@entity": "in.co.sandbox.kyc.aadhaar.okyc",
    "reference_id": 55409183,
    "status": "VALID",
    "message": "Aadhaar Card Exists",
    "care_of": "REDACTED",
    "full_address": "REDACTED",
    "date_of_birth": "",
    "email_hash": "REDACTED_HASH",
    "gender": "M",
    "name": "Mukesh R",
    "address": {
      "@entity": "REDACTED",
      "country": "REDACTED",
      "district": "REDACTED",
      "house": "REDACTED",
      "landmark": "REDACTED",
      "pincode": "REDACTED",
      "post_office": "REDACTED",
      "state": "REDACTED",
      "street": "REDACTED",
      "subdistrict": "REDACTED",
      "vtc": "REDACTED"
    },
    "year_of_birth": 2004,
    "mobile_hash": "REDACTED_HASH",
    "share_code": "2345"
  },
  "transaction_id": "90693cfa-cbb2-41d5-ad93-546c783a0c97"
}
```

## Database Schema

### AadhaarOtpSession Table
```sql
CREATE TABLE aadhaar_otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  aadhaar_number VARCHAR(12) NOT NULL,
  reference_id VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(user_id),
  INDEX(aadhaar_number),
  INDEX(expires_at)
);
```

## Security Features

- **Input Sanitization**: All user inputs are sanitized
- **OTP Expiration**: 2-minute TTL for OTP sessions
- **Hash Comparison**: Secure comparison of sensitive data
- **Authentication Required**: All endpoints require valid JWT token
- **Validation**: Comprehensive request validation using Joi
- **Persistent Storage**: Database-based OTP session management

## Error Handling

- **400**: Invalid request data
- **401**: Authentication required
- **202**: Manual review required
- **500**: Internal server error

## Cleanup Service

Automatically cleans up expired OTP sessions every 5 minutes to prevent database bloat.

## Usage Flow

1. User calls `/aadhaar/otp` with Aadhaar number
2. System sends OTP via KYC provider API and stores session in database
3. User receives OTP and calls `/register/kyc` with OTP
4. System verifies OTP and validates user data against Aadhaar records
5. KYC status updated based on verification result (3/5 field match required)

## Testing

```bash
# Send OTP
curl -X POST http://localhost:5000/api/v1/auth/aadhaar/otp \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=your-jwt-token" \
  -d '{"aadhaarNumber": "123456789012"}'

# Verify KYC
curl -X POST http://localhost:5000/api/v1/auth/register/kyc \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=your-jwt-token" \
  -d '{
    "referenceId": "55409183",
    "otp": "123456",
    "aadhaarNumber": "123456789012",
    "gender": "male"
  }'
```

## Configuration

1. Set environment variables in your `.env` file:
   ```env
   KYC_ACCESS_TOKEN=your-actual-access-token
   KYC_API_KEY=your-actual-api-key
   KYC_BASE_URL=https://your-kyc-provider.com
   ```

2. Ensure database migration is applied:
   ```bash
   npx prisma migrate deploy
   ```

3. Start the server:
   ```bash
   npm run dev
   ``` 