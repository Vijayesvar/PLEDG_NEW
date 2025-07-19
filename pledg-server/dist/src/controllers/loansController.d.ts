import { Request, Response } from 'express';
export declare const getMarketplace: (_req: Request, res: Response) => Promise<void>;
export declare const getLoanById: (req: Request, res: Response) => Promise<void>;
export declare const createLoan: (req: Request, res: Response) => Promise<void>;
export declare const confirmLoanTransaction: (req: Request, res: Response) => Promise<void>;
export declare const cancelLoan: (req: Request, res: Response) => Promise<void>;
export declare const payInstallment: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=loansController.d.ts.map