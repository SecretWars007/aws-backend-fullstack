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
const MockCustomerRepository_1 = require("../adapters/repositories/mock/MockCustomerRepository");
const PgCustomerRepository_1 = require("../adapters/repositories/postgres/PgCustomerRepository");
const bodyAuthMiddleware_1 = require("./middleware/bodyAuthMiddleware");
const customerControllers_1 = require("../adapters/controllers/customerControllers");
function buildRepository() {
    const isMock = process.env.MOCK_MODE === 'true';
    console.log(`[Customer Service] Running in ${isMock ? 'MOCK' : 'PRODUCTION'} mode`);
    return isMock ? new MockCustomerRepository_1.MockCustomerRepository() : new PgCustomerRepository_1.PgCustomerRepository();
}
function createApp() {
    const app = (0, express_1.default)();
    const repo = buildRepository();
    const walletServiceUrl = process.env.WALLET_SERVICE_URL ?? 'http://wallet-service:3003';
    // OWASP A05 - Security headers
    app.use((0, helmet_1.default)());
    // CORS
    app.use((0, cors_1.default)({
        origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
        methods: ['POST', 'GET', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Token'],
    }));
    // Body limits
    app.use(express_1.default.json({ limit: '5mb' })); // Selfie base64 could be larger, allow up to 5mb
    app.use(express_1.default.urlencoded({ extended: false, limit: '5mb' }));
    // OWASP A07 - Rate Limiter
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { state: 1, message: 'Demasiadas solicitudes. Intente más tarde.', code: 'TOO_MANY_REQUESTS' },
    });
    app.use(limiter);
    // Request logger
    app.use((req, _res, next) => {
        const id = req.headers['x-request-id'] ?? Date.now();
        console.log(`[Customer Service][${id}] ${req.method} ${req.path}`);
        next();
    });
    // Health check
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok', service: 'customer-service', timestamp: new Date().toISOString() });
    });
    // Internal Route (private to VPC, called by wallet-service)
    app.get('/internal/customer/phone/:cellphone', (0, customerControllers_1.getInternalCustomerByPhoneHandler)(repo));
    // Register routes (both V1 and V2, upper and lower case)
    const versions = ['V1', 'V2', 'v1', 'v2'];
    versions.forEach(v => {
        // 1. Get Extension Catalog
        app.post(`/${v}/client/device/register/extension/get`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.getExtensionCatalogHandler)(repo));
        app.post(`/${v}/document-extensions`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.getExtensionCatalogHandler)(repo));
        // 2. Validate User
        app.post(`/${v}/register/validate/user`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.validateUserHandler)(repo));
        app.post(`/${v}/users-validate`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.validateUserHandler)(repo));
        // 3. Validate OTP
        app.post(`/${v}/register/validate/otp`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.validateOtpHandler)(repo));
        app.post(`/${v}/otp-generate`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.validateOtpHandler)(repo));
        // 4. Init Face Recognition
        app.post(`/${v}/register/init/face/recognition`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.initFaceRecognitionHandler)(repo));
        app.post(`/${v}/face-recognition-init`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.initFaceRecognitionHandler)(repo));
        // 5. Execute Face Recognition
        app.post(`/${v}/register/execute/face/recognition`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.executeFaceRecognitionHandler)(repo));
        app.post(`/${v}/face-recognition-valid`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.executeFaceRecognitionHandler)(repo));
        // 6. Register Reference Code
        app.post(`/${v}/client/reference/register/code`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.registerReferenceCodeHandler)(repo));
        app.post(`/${v}/reference/register`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.registerReferenceCodeHandler)(repo));
        // 7. Create Account
        app.post(`/${v}/register/create/account`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.createAccountHandler)(repo, walletServiceUrl));
        app.post(`/${v}/users-create`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.createAccountHandler)(repo, walletServiceUrl));
        // 8. Login
        app.post(`/${v}/client/login/get`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.loginHandler)(repo));
        app.post(`/${v}/sign-in`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.loginHandler)(repo));
        // 9. Get Profile Parameters
        app.post(`/${v}/profile/parameters/get`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.getProfileParametersHandler)(repo));
        app.post(`/${v}/parameters`, bodyAuthMiddleware_1.requireBodyDeviceToken, (0, customerControllers_1.getProfileParametersHandler)(repo));
        // 10. Welcome Reference (intentional 404)
        app.post(`/${v}/client/reference/welcome`, customerControllers_1.welcomeReferenceHandler);
    });
    // 404 fallback
    app.use((_req, res) => {
        res.status(404).json({ state: 1, message: 'Endpoint no encontrado en Customer Service', code: 'NOT_FOUND' });
    });
    // Global error handler
    app.use((err, _req, res, _next) => {
        console.error('[Customer Service Unhandled Error]', err.message);
        res.status(500).json({ state: -1, message: 'Error interno en Customer Service', code: 'INTERNAL_SERVER_ERROR' });
    });
    return app;
}
//# sourceMappingURL=app.js.map