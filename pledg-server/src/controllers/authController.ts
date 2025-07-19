import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import Joi from 'joi';
import { sanitizeUserInput, sanitizeEmail, sanitizePhoneNumber } from '../utils/sanitize';
import { kycService } from '../services/kycService';
import { OAuth2Client } from 'google-auth-library';
import { JwtPayload } from '../types/auth';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const sanitizedEmail = sanitizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid password' });
      return;
    }

    const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
    const token = jwt.sign({ userId: user.id } as JwtPayload, jwtSecret);
    
    res.cookie('authToken', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });
    
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response): void => {
  console.log(req.cookies);
  res.clearCookie('authToken', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
  });
  res.status(200).json({ message: 'Logout successful' });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('req.cookies', req.cookies['authToken']);
    const token = req.cookies['authToken'];
    
    if (!token) {
      res.status(401).json({ message: 'No authentication token provided' });
      return;
    }

    const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      const userId = decoded.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json({
        success: true,
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (jwtError) {
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: process.env['GOOGLE_CLIENT_ID'],
        client_secret: process.env['GOOGLE_CLIENT_SECRET'],
        redirect_uri: process.env['GOOGLE_REDIRECT_URI'],
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await response.json() as { id_token: string };

    const googleClient = new OAuth2Client(process.env['GOOGLE_CLIENT_ID'] || '');
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenData.id_token,
      audience: process.env['GOOGLE_CLIENT_ID'] || '',
    });
    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email || '' },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, process.env['JWT_SECRET'] || 'fallback-secret');

    res.cookie('authToken', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(200).json({ message: 'Google login successful' });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const registerBasicInfo = async (req: Request, res: Response) => {
  try {
    // validate request body
    const schema = Joi.object({
      firstname: Joi.string().required(),
      lastname: Joi.string().required(),
      email: Joi.string().email().required(),
      gender: Joi.string().valid('male', 'female', 'others').required(),
      dob: Joi.date().required(),
      address: Joi.string().required(),
      phoneNumber: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
      // least 8 characters, 1 letter, 1 number, 1 special character
      password: Joi.string().pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/).required(),
    });
    
    const { error, value } = schema.validate(req.body);

    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    // Sanitize all input data
    const sanitizedData = sanitizeUserInput(value);

    // check if email is already registered
    const emailUser = await prisma.user.findFirst({
      where: {
        email: sanitizedData.email,
      },
      select: {
        id: true,
      },
    });

    if (emailUser) {
      if (req.cookies['authToken']) {
        const decoded = jwt.verify(req.cookies['authToken'], process.env['JWT_SECRET'] || 'fallback-secret') as { userId: string };
        const userId = decoded.userId;

        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (user?.email == sanitizedData.email) {
          res.status(200).json({ message: 'Email already registered' });
          return;
        }
      }
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    // check if phone number is already registered (if provided)
    if (value.phoneNumber) {
      const sanitizedPhone = sanitizePhoneNumber(value.phoneNumber);
      
      const phoneUser = await prisma.user.findFirst({
        where: {
          phoneNumber: sanitizedPhone,
        },
      });
      
      if (phoneUser) {
        res.status(400).json({ message: 'Phone number already registered' });
        return;
      }
    }

    const user = await prisma.user.create({
      data: {
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        email: sanitizedData.email,
        dateOfBirth: sanitizedData.dateOfBirth,
        phoneNumber: value.phoneNumber ? sanitizePhoneNumber(value.phoneNumber) : null,
        passwordHash: await bcrypt.hash(value.password, 10),
        emailRegistered: true,
        kycBasicStatus: 'verified',
      }
    });

    const token = jwt.sign({ userId: user.id }, process.env['JWT_SECRET'] || 'fallback-secret');

    res.cookie('authToken', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.status(200).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Register basic info error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const registerBank = async (req: Request, res: Response) => {
  try {
    const token = req.cookies['authToken'];
    if (!token) {
      res.status(401).json({ message: 'No authentication token provided' });
      return;
    }

    const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const userId = decoded.userId;

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    if (userExists.kycBasicStatus !== 'verified') {
      res.status(401).json({ message: 'KYC basic not verified' });
      return;
    }

    if (userExists.kycBankStatus === 'verified') {
      res.status(200).json({ message: 'KYC bank already verified' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { kycBankStatus: 'verified' },
    });

    res.status(200).json({ message: 'KYC bank verified' });
  } catch (error) {
    console.error('Register bank error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendAadhaarOtp = async (req: Request, res: Response) => {
  try {
    const token = req.cookies['authToken'];
    if (!token) {
      res.status(401).json({ message: 'No authentication token provided' });
      return;
    }

    const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const userId = decoded.userId;

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (userExists.kycBankStatus !== 'verified') {
      res.status(401).json({ message: 'KYC bank not verified' });
      return;
    }

    if (userExists.kycAadharStatus === 'verified') {
      res.status(400).json({ message: 'KYC aadhar already verified' });
      return;
    }

    const schema = Joi.object({
      aadhaarNumber: Joi.string().pattern(/^[0-9]{12}$/).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    const result = await kycService.sendAadhaarOtp(userId, value.aadhaarNumber);

    if (result.success) {
      res.status(200).json({
        message: 'OTP sent successfully',
        referenceId: result.referenceId
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Send Aadhaar OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const registerKyc = async (req: Request, res: Response) => {
  try {
    const token = req.cookies['authToken'];
    if (!token) {
      res.status(401).json({ message: 'No authentication token provided' });
      return;
    }

    const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const userId = decoded.userId;

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (userExists.kycBankStatus !== 'verified') {
      res.status(401).json({ message: 'KYC bank not verified' });
      return;
    }

    if (userExists.kycAadharStatus === 'verified') {
      res.status(400).json({ message: 'KYC aadhar already verified' });
      return;
    }
    
    const schema = Joi.object({
      referenceId: Joi.string().required(),
      otp: Joi.string().pattern(/^[0-9]{6}$/).required(),
      aadhaarNumber: Joi.string().pattern(/^[0-9]{12}$/).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    const userData: {
      name: string;
      yearOfBirth: number;
      gender: string;
      email?: string;
      mobile?: string;
    } = {
      name: `${userExists.firstName} ${userExists.lastName}`.trim(),
      yearOfBirth: userExists.dateOfBirth ? userExists.dateOfBirth.getFullYear() : 0,
      gender: req.body.gender || 'male',
      email: userExists.email,
    };

    if (userExists.phoneNumber) {
      userData.mobile = userExists.phoneNumber;
    }

    const verificationResult = await kycService.verifyAadhaarKyc({
      userId,
      aadhaarNumber: value.aadhaarNumber,
      referenceId: value.referenceId,
      otp: value.otp,
      userData,
    });
    console.log("VERIFICATION RESULT:",verificationResult);
    if (verificationResult.success) {
    await prisma.user.update({
      where: { id: userId },
      data: { kycAadharStatus: 'verified' },
    });

      res.status(200).json({ 
        message: 'KYC aadhar verified successfully',
        details: verificationResult.message
      });
    } else if (verificationResult.requiresManualReview) {
      await prisma.user.update({
        where: { id: userId },
        data: { kycAadharStatus: 'pending' },
      });

      res.status(202).json({ 
        message: 'KYC verification requires manual review',
        details: verificationResult.message
      });
    } else {
      res.status(400).json({ 
        message: 'KYC verification failed',
        details: verificationResult.message
      });
    }
  } catch (error) {
    console.error('Register kyc error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 