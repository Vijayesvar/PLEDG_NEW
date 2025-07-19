"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const client_1 = require("@prisma/client");
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const cleanupService_1 = require("./services/cleanupService");
const auth_1 = __importDefault(require("./routes/auth"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const users_1 = __importDefault(require("./routes/users"));
const loans_1 = __importDefault(require("./routes/loans"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env['PORT'] || 5000;
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.options('/{*any}', (0, cors_1.default)(corsOptions));
app.get('/', (_req, res) => {
    res.json({
        message: 'Pledg Server API',
        version: '1.0.0'
    });
});
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/wallet', wallet_1.default);
app.use('/api/v1/users', users_1.default);
app.use('/api/v1/loans', loans_1.default);
app.use('/api/v1/dashboard', dashboard_1.default);
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});
app.use(errorHandler_1.default);
async function startServer() {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');
        cleanupService_1.cleanupService.startCleanupService();
        console.log('Cleanup service started');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
async function gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    try {
        cleanupService_1.cleanupService.stopCleanupService();
        console.log('Cleanup service stopped');
        await prisma.$disconnect();
        console.log('Database disconnected');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
startServer().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map