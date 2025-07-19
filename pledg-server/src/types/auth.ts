import { Request } from "express";

export interface JwtPayload {
  userId: string;
}

export interface AuthenticatedRequest extends Request {
    user: {
      userId: string
    };
  }