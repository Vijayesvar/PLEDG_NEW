export declare const ERROR_CODES: {
    readonly VALIDATION_ERROR: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly SERVER_ERROR: 500;
};
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
//# sourceMappingURL=errorCodes.d.ts.map