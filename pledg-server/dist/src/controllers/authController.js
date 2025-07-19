"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerKyc = exports.sendAadhaarOtp = exports.registerBank = exports.registerBasicInfo = exports.googleLogin = exports.getMe = exports.logout = exports.login = void 0;
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const sanitize_1 = require("../utils/sanitize");
const kycService_1 = require("../services/kycService");
const google_auth_library_1 = require("google-auth-library");
const prisma = new client_1.PrismaClient();
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const sanitizedEmail = (0, sanitize_1.sanitizeEmail)(email);
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
        const token = jwt.sign({ userId: user.id }, jwtSecret);
        res.cookie('authToken', token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });
        res.status(200).json({ message: 'Login successful' });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.login = login;
const logout = (req, res) => {
    console.log(req.cookies);
    res.clearCookie('authToken', {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
    });
    res.status(200).json({ message: 'Logout successful' });
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        const token = req.cookies['authToken'];
        if (!token) {
            res.status(401).json({ message: 'No authentication token provided' });
            return;
        }
        const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
        try {
            const decoded = jwt.verify(token, jwtSecret);
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
        }
        catch (jwtError) {
            res.status(401).json({ message: 'Invalid or expired token' });
        }
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMe = getMe;
const googleLogin = async (req, res) => {
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
        const tokenData = await response.json();
        const googleClient = new google_auth_library_1.OAuth2Client(process.env['GOOGLE_CLIENT_ID'] || '');
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
    }
    catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.googleLogin = googleLogin;
const registerBasicInfo = async (req, res) => {
    try {
        const schema = joi_1.default.object({
            firstname: joi_1.default.string().required(),
            lastname: joi_1.default.string().required(),
            email: joi_1.default.string().email().required(),
            gender: joi_1.default.string().valid('male', 'female', 'others').required(),
            dob: joi_1.default.date().required(),
            address: joi_1.default.string().required(),
            phoneNumber: joi_1.default.string().pattern(/^[6-9]\d{9}$/).optional(),
            password: joi_1.default.string().pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/).required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.message });
            return;
        }
        const sanitizedData = (0, sanitize_1.sanitizeUserInput)(value);
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
                const decoded = jwt.verify(req.cookies['authToken'], process.env['JWT_SECRET'] || 'fallback-secret');
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
        if (value.phoneNumber) {
            const sanitizedPhone = (0, sanitize_1.sanitizePhoneNumber)(value.phoneNumber);
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
                phoneNumber: value.phoneNumber ? (0, sanitize_1.sanitizePhoneNumber)(value.phoneNumber) : null,
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
    }
    catch (error) {
        console.error('Register basic info error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.registerBasicInfo = registerBasicInfo;
const registerBank = async (req, res) => {
    try {
        const token = req.cookies['authToken'];
        if (!token) {
            res.status(401).json({ message: 'No authentication token provided' });
            return;
        }
        const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
        const decoded = jwt.verify(token, jwtSecret);
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
    }
    catch (error) {
        console.error('Register bank error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.registerBank = registerBank;
const sendAadhaarOtp = async (req, res) => {
    try {
        const token = req.cookies['authToken'];
        if (!token) {
            res.status(401).json({ message: 'No authentication token provided' });
            return;
        }
        const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
        const decoded = jwt.verify(token, jwtSecret);
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
        const schema = joi_1.default.object({
            aadhaarNumber: joi_1.default.string().pattern(/^[0-9]{12}$/).required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.message });
            return;
        }
        const result = await kycService_1.kycService.sendAadhaarOtp(userId, value.aadhaarNumber);
        if (result.success) {
            res.status(200).json({
                message: 'OTP sent successfully',
                referenceId: result.referenceId
            });
        }
        else {
            res.status(400).json({ message: result.message });
        }
    }
    catch (error) {
        console.error('Send Aadhaar OTP error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.sendAadhaarOtp = sendAadhaarOtp;
const registerKyc = async (req, res) => {
    try {
        const token = req.cookies['authToken'];
        if (!token) {
            res.status(401).json({ message: 'No authentication token provided' });
            return;
        }
        const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
        const decoded = jwt.verify(token, jwtSecret);
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
        const schema = joi_1.default.object({
            referenceId: joi_1.default.string().required(),
            otp: joi_1.default.string().pattern(/^[0-9]{6}$/).required(),
            aadhaarNumber: joi_1.default.string().pattern(/^[0-9]{12}$/).required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.message });
            return;
        }
        const userData = {
            name: `${userExists.firstName} ${userExists.lastName}`.trim(),
            yearOfBirth: userExists.dateOfBirth ? userExists.dateOfBirth.getFullYear() : 0,
            gender: req.body.gender || 'male',
            email: userExists.email,
        };
        if (userExists.phoneNumber) {
            userData.mobile = userExists.phoneNumber;
        }
        const verificationResult = await kycService_1.kycService.verifyAadhaarKyc({
            userId,
            aadhaarNumber: value.aadhaarNumber,
            referenceId: value.referenceId,
            otp: value.otp,
            userData,
        });
        console.log("VERIFICATION RESULT:", verificationResult);
        if (verificationResult.success) {
            await prisma.user.update({
                where: { id: userId },
                data: { kycAadharStatus: 'verified' },
            });
            res.status(200).json({
                message: 'KYC aadhar verified successfully',
                details: verificationResult.message
            });
        }
        else if (verificationResult.requiresManualReview) {
            await prisma.user.update({
                where: { id: userId },
                data: { kycAadharStatus: 'pending' },
            });
            res.status(202).json({
                message: 'KYC verification requires manual review',
                details: verificationResult.message
            });
        }
        else {
            res.status(400).json({
                message: 'KYC verification failed',
                details: verificationResult.message
            });
        }
    }
    catch (error) {
        console.error('Register kyc error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.registerKyc = registerKyc;
//# sourceMappingURL=authController.js.map