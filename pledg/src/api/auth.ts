const BE_SERVER = process.env.NEXT_PUBLIC_BE_SERVER || 'http://localhost:5000/api/v1';

// Types for the API
export interface RegisterBasicData {
  firstname: string;
  lastname: string;
  email: string;
  gender: string;
  dob: string;
  address: string;
  password: string;
  phoneNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  email: string;
  firstName: string;
  lastName: string;
  kycBasicStatus?: string;
  kycBankStatus?: string;
  kycAadharStatus?: string;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  user?: User;
}

export interface AadhaarOtpRequest {
  aadhaarNumber: string;
}

export interface AadhaarOtpResponse {
  message: string;
  referenceId: string;
}

export interface AadhaarKycRequest {
  referenceId: string;
  otp: string;
  aadhaarNumber: string;
}

export interface AadhaarKycResponse {
  message: string;
  details?: string;
}

// 1. User Registration (Basic Info)
export const registerBasic = async (data: RegisterBasicData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BE_SERVER}/auth/register/basic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }
    
    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || 'Registration failed');
    }
    throw new Error('Registration failed');
  }
};

// 2. Bank Account Verification
export const registerBank = async (): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BE_SERVER}/auth/register/bank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Bank verification failed');
    }
    
    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || 'Bank verification failed');
    }
    throw new Error('Bank verification failed');
  }
};

// 3. Send Aadhaar OTP
export const sendAadhaarOtp = async (data: AadhaarOtpRequest): Promise<AadhaarOtpResponse> => {
  try {
    const response = await fetch(`${BE_SERVER}/auth/aadhaar/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send OTP');
    }
    
    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || 'Failed to send OTP');
    }
    throw new Error('Failed to send OTP');
  }
};

// 4. Verify Aadhaar KYC
export const verifyAadhaarKyc = async (data: AadhaarKycRequest): Promise<AadhaarKycResponse> => {
  try {
    const response = await fetch(`${BE_SERVER}/auth/register/kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Aadhaar verification failed');
    }
    
    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || 'Aadhaar verification failed');
    }
    throw new Error('Aadhaar verification failed');
  }
};

// 5. Aadhar Verification (Legacy - keeping for backward compatibility)
export const registerKyc = async (): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BE_SERVER}/auth/register-kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Aadhar verification failed');
    }
    
    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || 'Aadhar verification failed');
    }
    throw new Error('Aadhar verification failed');
  }
};

// 6. User Login
export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BE_SERVER}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }
    
    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || 'Login failed');
    }
    throw new Error('Login failed');
  }
};

export const googleLogin = async (code: string): Promise<{ message: string }> => {
  const response = await fetch(`${BE_SERVER}/auth/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Google login failed');
  }
  return data;
};

export const logout = async (): Promise<void> => {
  try {
    const response = await fetch(`${BE_SERVER}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Logout failed');
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || 'Logout failed');
    }
    throw new Error('Logout failed');
  }
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BE_SERVER}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to get user data');
    }
    
    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || 'Failed to get user data');
    }
    throw new Error('Failed to get user data');
  }
};
