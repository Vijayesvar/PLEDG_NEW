import { Request, Response, NextFunction } from 'express';
declare const errorHandler: (err: Error & {
    statusCode?: number;
    stackTrace?: string;
}, _req: Request, res: Response, _next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map