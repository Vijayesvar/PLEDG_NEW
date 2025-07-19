import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpay: Razorpay | null = null;

// Initialize Razorpay only if credentials are available
if (process.env['RAZORPAY_KEY_ID'] && process.env['RAZORPAY_KEY_SECRET']) {
  razorpay = new Razorpay({
    key_id: process.env['RAZORPAY_KEY_ID']!,
    key_secret: process.env['RAZORPAY_KEY_SECRET']!,
  });
} else {
  console.warn('⚠️  Razorpay credentials not found. Payment features will be disabled.');
  console.warn('   Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
}

export const createOrder = async (amount: number, currency: string, receipt: string) => {
  if (!razorpay) {
    throw new Error('Razorpay service not initialized. Please check environment variables.');
  }
  
  return razorpay.orders.create({
    amount: Math.round(amount * 100), // Razorpay expects paise
    currency,
    receipt,
    payment_capture: true,
  });
};

export const verifyWebhookSignature = (body: any, signature: string) => {
  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'];
  if (!secret) {
    console.warn('⚠️  Razorpay webhook secret not found. Webhook verification will be disabled.');
    return false;
  }
  
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return expected === signature;
};

export const createPayout = async (amount: number, currency: string, accountSecureToken: string, purpose: string, referenceId: string) => {
  // RazorpayX payouts use a different API endpoint and authentication
  // You need to use your RazorpayX credentials and the correct endpoint
  // This is a simplified example using fetch; in production, use a proper HTTP client and handle errors securely
  const key_id = process.env['RAZORPAY_X_KEY_ID'];
  const key_secret = process.env['RAZORPAY_X_KEY_SECRET'];
  const account_number = process.env['RAZORPAY_X_ACCOUNT_NUMBER'];
  
  if (!key_id || !key_secret || !account_number) {
    throw new Error('RazorpayX credentials not found. Please check environment variables.');
  }
  
  const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      account_number: account_number, // Your platform's account number
      fund_account_id: accountSecureToken, // Razorpay secure token for the user
      amount: Math.round(amount * 100), // in paise
      currency,
      mode: 'IMPS', // or NEFT/UPI etc.
      purpose,
      reference_id: referenceId,
      narration: purpose,
    }),
  });

  if (!response.ok) {
    const error: any = await response.json();
    throw new Error(`Payout failed: ${error.error?.description || response.statusText}`);
  }

  return response.json();
}; 