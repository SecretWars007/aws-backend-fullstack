"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const MockWalletRepository_1 = require("../adapters/repositories/mock/MockWalletRepository");
const PgWalletRepository_1 = require("../adapters/repositories/postgres/PgWalletRepository");
const bodyAuthMiddleware_1 = require("./middleware/bodyAuthMiddleware");
const headerAuthMiddleware_1 = require("./middleware/headerAuthMiddleware");
const walletControllers_1 = require("../adapters/controllers/walletControllers");
function buildRepository() {
    const isMock = process.env.MOCK_MODE === 'true';
    console.log(`[Wallet Service] Running in ${isMock ? 'MOCK' : 'PRODUCTION'} mode`);
    return isMock ? new MockWalletRepository_1.MockWalletRepository() : new PgWalletRepository_1.PgWalletRepository();
}
function createApp() {
    const app = (0, express_1.default)();
    const repo = buildRepository();
    // OWASP A05 - Security headers
    app.use((0, helmet_1.default)());
    // CORS
    app.use((0, cors_1.default)({
        origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
        methods: ['POST', 'GET', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Token'],
    }));
    // Body limits
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: false, limit: '1mb' }));
    // OWASP A07 - Rate Limiter (disabled in test environment to avoid 429 interference)
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: process.env.NODE_ENV === 'test' ? 10000 : 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { state: 1, message: 'Demasiadas solicitudes. Intente más tarde.', code: 'TOO_MANY_REQUESTS' },
    });
    app.use(limiter);
    // Request logger
    app.use((req, _res, next) => {
        const id = req.headers['x-request-id'] ?? Date.now();
        console.log(`[Wallet Service][${id}] ${req.method} ${req.path}`);
        next();
    });
    // Health check
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok', service: 'wallet-service', timestamp: new Date().toISOString() });
    });
    // Internal route (called internally by customer-service, no V1/V2 prefix needed)
    app.post('/internal/wallet/create', (0, walletControllers_1.createInternalWalletHandler)(repo));
    // Register public routes (both V1 and V2, upper and lower case)
    const v1Versions = ['V1', 'v1'];
    const v2Versions = ['V2', 'v2'];
    // V1 Routes - Require body token
    v1Versions.forEach(v => {
        app.post(`/${v}/client/walletcards/information/get`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.getBalancesHandler)(repo));
        app.post(`/${v}/balances`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.getBalancesHandler)(repo));
        app.post(`/${v}/recharge/parameters/get`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.getRechargeParamsHandler)(repo));
        app.post(`/${v}/recharge-params`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.getRechargeParamsHandler)(repo));
        app.post(`/${v}/recharge/entel`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.rechargeEntelHandler)(repo));
        app.post(`/${v}/recharge/tigo`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.rechargeTigoHandler)(repo));
        app.post(`/${v}/recharge/viva`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.rechargeVivaHandler)(repo));
        app.post(`/${v}/recharge-entel`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.rechargeEntelHandler)(repo));
        app.post(`/${v}/recharge-tigo`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.rechargeTigoHandler)(repo));
        app.post(`/${v}/recharge-viva`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.rechargeVivaHandler)(repo));
        app.post(`/${v}/transfers/validate`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.transferValidateHandler)(repo));
        app.post(`/${v}/transfers/users-validate`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.transferValidateHandler)(repo));
        app.post(`/${v}/transfers/token/generate`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.transferTokenGenerateHandler)(repo));
        app.post(`/${v}/token-generate`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.transferTokenGenerateHandler)(repo));
        app.post(`/${v}/transfers/execute`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.transferExecuteHandler)(repo));
        app.post(`/${v}/transfers-execute`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.transferExecuteHandler)(repo));
        app.post(`/${v}/movements`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, walletControllers_1.getMovementsHandler)(repo));
    });
    // V2 Routes - Require header token
    v2Versions.forEach(v => {
        app.post(`/${v}/client/walletcards/information/get`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.getBalancesHandler)(repo));
        app.post(`/${v}/balances`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.getBalancesHandler)(repo));
        app.post(`/${v}/recharge/parameters/get`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.getRechargeParamsHandler)(repo));
        app.post(`/${v}/recharge-params`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.getRechargeParamsHandler)(repo));
        app.post(`/${v}/recharge/entel`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.rechargeEntelHandler)(repo));
        app.post(`/${v}/recharge/tigo`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.rechargeTigoHandler)(repo));
        app.post(`/${v}/recharge/viva`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.rechargeVivaHandler)(repo));
        app.post(`/${v}/recharge-entel`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.rechargeEntelHandler)(repo));
        app.post(`/${v}/recharge-tigo`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.rechargeTigoHandler)(repo));
        app.post(`/${v}/recharge-viva`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.rechargeVivaHandler)(repo));
        app.post(`/${v}/transfers/validate`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.transferValidateHandler)(repo));
        app.post(`/${v}/transfers/users-validate`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.transferValidateHandler)(repo));
        app.post(`/${v}/transfers/token/generate`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.transferTokenGenerateHandler)(repo));
        app.post(`/${v}/token-generate`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.transferTokenGenerateHandler)(repo));
        app.post(`/${v}/transfers/execute`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.transferExecuteHandler)(repo));
        app.post(`/${v}/transfers-execute`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.transferExecuteHandler)(repo));
        app.post(`/${v}/movements`, headerAuthMiddleware_1.requireHeaderDeviceToken, (0, walletControllers_1.getMovementsHandler)(repo));
    });
    // 404 fallback
    app.use((_req, res) => {
        res.status(404).json({ state: 1, message: 'Endpoint no encontrado en Wallet Service', code: 'NOT_FOUND' });
    });
    // Global error handler
    app.use((err, _req, res, _next) => {
        console.error('[Wallet Service Unhandled Error]', err.message);
        res.status(500).json({ state: -1, message: 'Error interno en Wallet Service', code: 'INTERNAL_SERVER_ERROR' });
    });
    return app;
}
//# sourceMappingURL=app.js.map