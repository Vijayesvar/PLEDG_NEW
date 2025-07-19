import { Request, Response } from 'express';
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const logout: (req: Request, res: Response) => void;
export declare const getMe: (req: Request, res: Response) => Promise<void>;
export declare const googleLogin: (req: Request, res: Response) => Promise<void>;
export declare const registerBasicInfo: (req: Request, res: Response) => Promise<void>;
export declare const registerBank: (req: Request, res: Response) => Promise<void>;
export declare const sendAadhaarOtp: (req: Request, res: Response) => Promise<void>;
export declare const registerKyc: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map