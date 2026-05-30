import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
import { MockCustomerRepository } from '../adapters/repositories/mock/MockCustomerRepository';
import { PgCustomerRepository } from '../adapters/repositories/postgres/PgCustomerRepository';
import { requireBodyDeviceToken } from './middleware/bodyAuthMiddleware';
import { requireHeaderDeviceToken } from './middleware/headerAuthMiddleware';
import {
  getExtensionCatalogHandler,
  validateUserHandler,
  validateOtpHandler,
  initFaceRecognitionHandler,
  executeFaceRecognitionHandler,
  registerReferenceCodeHandler,
  createAccountHandler,
  loginHandler,
  getProfileParametersHandler,
  welcomeReferenceHandler,
  getInternalCustomerByPhoneHandler
} from '../adapters/controllers/customerControllers';

function buildRepository(): ICustomerRepository {
  const isMock = process.env.MOCK_MODE === 'true';
  console.log(`[Customer Service] Running in ${isMock ? 'MOCK' : 'PRODUCTION'} mode`);
  return isMock ? new MockCustomerRepository() : new PgCustomerRepository();
}

export function createApp(): express.Application {
  const app = express();
  const repo = buildRepository();
  const walletServiceUrl = process.env.WALLET_SERVICE_URL ?? 'http://wallet-service:3003';

  // OWASP A05 - Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Token'],
  }));

  // Body limits
  app.use(express.json({ limit: '5mb' })); // Selfie base64 could be larger, allow up to 5mb
  app.use(express.urlencoded({ extended: false, limit: '5mb' }));

  // OWASP A07 - Rate Limiter (disabled in test environment to avoid 429 interference)
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 10_000 : 100,
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
  app.get('/internal/customer/phone/:cellphone', getInternalCustomerByPhoneHandler(repo));

  // Register routes (both V1 and V2, upper and lower case)
  const v1Versions = ['V1', 'v1'];
  const v2Versions = ['V2', 'v2'];

  // V1 Routes - Require body token
  v1Versions.forEach(v => {
    app.post(`/${v}/client/device/register/extension/get`, requireBodyDeviceToken, getExtensionCatalogHandler(repo));
    app.post(`/${v}/document-extensions`, requireBodyDeviceToken, getExtensionCatalogHandler(repo));
    app.post(`/${v}/register/validate/user`, requireBodyDeviceToken, validateUserHandler(repo));
    app.post(`/${v}/users-validate`, requireBodyDeviceToken, validateUserHandler(repo));
    app.post(`/${v}/register/validate/otp`, requireBodyDeviceToken, validateOtpHandler(repo));
    app.post(`/${v}/otp-generate`, requireBodyDeviceToken, validateOtpHandler(repo));
    app.post(`/${v}/register/init/face/recognition`, requireBodyDeviceToken, initFaceRecognitionHandler(repo));
    app.post(`/${v}/face-recognition-init`, requireBodyDeviceToken, initFaceRecognitionHandler(repo));
    app.post(`/${v}/register/execute/face/recognition`, requireBodyDeviceToken, executeFaceRecognitionHandler(repo));
    app.post(`/${v}/face-recognition-valid`, requireBodyDeviceToken, executeFaceRecognitionHandler(repo));
    app.post(`/${v}/client/reference/register/code`, requireBodyDeviceToken, registerReferenceCodeHandler(repo));
    app.post(`/${v}/reference/register`, requireBodyDeviceToken, registerReferenceCodeHandler(repo));
    app.post(`/${v}/register/create/account`, requireBodyDeviceToken, createAccountHandler(repo, walletServiceUrl));
    app.post(`/${v}/users-create`, requireBodyDeviceToken, createAccountHandler(repo, walletServiceUrl));
    app.post(`/${v}/client/login/get`, requireBodyDeviceToken, loginHandler(repo));
    app.post(`/${v}/sign-in`, requireBodyDeviceToken, loginHandler(repo));
    app.post(`/${v}/profile/parameters/get`, requireBodyDeviceToken, getProfileParametersHandler(repo));
    app.post(`/${v}/parameters`, requireBodyDeviceToken, getProfileParametersHandler(repo));
    app.post(`/${v}/client/reference/welcome`, welcomeReferenceHandler);
  });

  // V2 Routes - Require header token
  v2Versions.forEach(v => {
    app.post(`/${v}/client/device/register/extension/get`, requireHeaderDeviceToken, getExtensionCatalogHandler(repo));
    app.post(`/${v}/document-extensions`, requireHeaderDeviceToken, getExtensionCatalogHandler(repo));
    app.post(`/${v}/register/validate/user`, requireHeaderDeviceToken, validateUserHandler(repo));
    app.post(`/${v}/users-validate`, requireHeaderDeviceToken, validateUserHandler(repo));
    app.post(`/${v}/register/validate/otp`, requireHeaderDeviceToken, validateOtpHandler(repo));
    app.post(`/${v}/otp-generate`, requireHeaderDeviceToken, validateOtpHandler(repo));
    app.post(`/${v}/register/init/face/recognition`, requireHeaderDeviceToken, initFaceRecognitionHandler(repo));
    app.post(`/${v}/face-recognition-init`, requireHeaderDeviceToken, initFaceRecognitionHandler(repo));
    app.post(`/${v}/register/execute/face/recognition`, requireHeaderDeviceToken, executeFaceRecognitionHandler(repo));
    app.post(`/${v}/face-recognition-valid`, requireHeaderDeviceToken, executeFaceRecognitionHandler(repo));
    app.post(`/${v}/client/reference/register/code`, requireHeaderDeviceToken, registerReferenceCodeHandler(repo));
    app.post(`/${v}/reference/register`, requireHeaderDeviceToken, registerReferenceCodeHandler(repo));
    app.post(`/${v}/register/create/account`, requireHeaderDeviceToken, createAccountHandler(repo, walletServiceUrl));
    app.post(`/${v}/users-create`, requireHeaderDeviceToken, createAccountHandler(repo, walletServiceUrl));
    app.post(`/${v}/client/login/get`, requireHeaderDeviceToken, loginHandler(repo));
    app.post(`/${v}/sign-in`, requireHeaderDeviceToken, loginHandler(repo));
    app.post(`/${v}/profile/parameters/get`, requireHeaderDeviceToken, getProfileParametersHandler(repo));
    app.post(`/${v}/parameters`, requireHeaderDeviceToken, getProfileParametersHandler(repo));
    app.post(`/${v}/client/reference/welcome`, welcomeReferenceHandler);
  });

  // 404 fallback
  app.use((_req, res) => {
    res.status(404).json({ state: 1, message: 'Endpoint no encontrado en Customer Service', code: 'NOT_FOUND' });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Customer Service Unhandled Error]', err.message);
    res.status(500).json({ state: -1, message: 'Error interno en Customer Service', code: 'INTERNAL_SERVER_ERROR' });
  });

  return app;
}
