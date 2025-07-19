import { Request, Response } from 'express';

export const addWallet = (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Add wallet endpoint - not implemented' });
}; 