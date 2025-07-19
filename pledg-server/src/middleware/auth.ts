import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, JwtPayload } from "../types/auth";
import { prisma } from "../../prisma/prismaClient";

export const auth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies['authToken'];
        if (!token) {
            console.log(req.cookies['authToken']);
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const decoded = jwt.verify(token, process.env['JWT_SECRET'] as string) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId,
            },
        });

        if (!user) {
            console.log(req.cookies['authToken'], decoded);
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        req.user = {
            userId: decoded.userId,
        };

        next();
    
} catch (error) {
        console.error(error);
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
};
