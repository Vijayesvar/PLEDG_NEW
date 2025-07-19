"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorCodes_1 = require("../constants/errorCodes");
const errorHandler = (err, _req, res, _next) => {
    const statusCode = res.statusCode || err.statusCode || errorCodes_1.ERROR_CODES.SERVER_ERROR;
    const errorResponse = {
        error: 'Server Error',
        message: err.message || 'An unexpected error occurred',
    };
    if (process.env['NODE_ENV'] === 'development') {
        const stackTrace = err.stackTrace || err.stack;
        if (stackTrace) {
            errorResponse.stackTrace = stackTrace;
        }
    }
    switch (statusCode) {
        case errorCodes_1.ERROR_CODES.VALIDATION_ERROR:
            errorResponse.error = 'Validation Failed';
            break;
        case errorCodes_1.ERROR_CODES.NOT_FOUND:
            errorResponse.error = 'Not Found';
            break;
        case errorCodes_1.ERROR_CODES.UNAUTHORIZED:
            errorResponse.error = 'Unauthorized';
            break;
        case errorCodes_1.ERROR_CODES.SERVER_ERROR:
            errorResponse.error = 'Server Error';
            break;
        case errorCodes_1.ERROR_CODES.FORBIDDEN:
            errorResponse.error = 'Forbidden';
            break;
        default:
            errorResponse.error = 'All Good!';
            break;
    }
    res.status(statusCode).json(errorResponse);
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map