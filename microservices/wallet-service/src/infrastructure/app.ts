import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { IWalletRepository } from '../domain/repositories/IWalletRepository';
import { MockWalletRepository } from '../adapters/repositories/mock/MockWalletRepository';
import { PgWalletRepository } from '../adapters/repositories/postgres/PgWalletRepository';
import { requireBodyDeviceToken } from './middleware/bodyAuthMiddleware';
import { requireHeaderDeviceToken } from './middleware/headerAuthMiddleware';
import {
  getBalancesHandler,
  getRechargeParamsHandler,
  rechargeEntelHandler,
  rechargeTigoHandler,
  rechargeVivaHandler,
  transferValidateHandler,
  transferTokenGenerateHandler,
  transferExecuteHandler,
  createInternalWalletHandler,
  getMovementsHandler
} from '../adapters/controllers/walletControllers';

function buildRepository(): IWalletRepository {
  const isMock = process.env.MOCK_MODE === 'true';
  console.log(`[Wallet Service] Running in ${isMock ? 'MOCK' : 'PRODUCTION'} mode`);
  return isMock ? new MockWalletRepository() : new PgWalletRepository();
}

export function createApp(): express.Application {
  const app = express();
  const repo = buildRepository();

  // OWASP A05 - Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Token'],
  }));

  // Body limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

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
    console.log(`[Wallet Service][${id}] ${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'wallet-service', timestamp: new Date().toISOString() });
  });

  // Internal route (called internally by customer-service, no V1/V2 prefix needed)
  app.post('/internal/wallet/create', createInternalWalletHandler(repo));

  // Register public routes (both V1 and V2, upper and lower case)
  const v1Versions = ['V1', 'v1'];
  const v2Versions = ['V2', 'v2'];

  // V1 Routes - Require body token
  v1Versions.forEach(v => {
    app.post(`/${v}/client/walletcards/information/get`, requireBodyDeviceToken, getBalancesHandler(repo));
    app.post(`/${v}/balances`, requireBodyDeviceToken, getBalancesHandler(repo));
    app.post(`/${v}/recharge/parameters/get`, requireBodyDeviceToken, getRechargeParamsHandler(repo));
    app.post(`/${v}/recharge-params`, requireBodyDeviceToken, getRechargeParamsHandler(repo));
    app.post(`/${v}/recharge/entel`, requireBodyDeviceToken, rechargeEntelHandler(repo));
    app.post(`/${v}/recharge/tigo`, requireBodyDeviceToken, rechargeTigoHandler(repo));
    app.post(`/${v}/recharge/viva`, requireBodyDeviceToken, rechargeVivaHandler(repo));
    app.post(`/${v}/recharge-entel`, requireBodyDeviceToken, rechargeEntelHandler(repo));
    app.post(`/${v}/recharge-tigo`, requireBodyDeviceToken, rechargeTigoHandler(repo));
    app.post(`/${v}/recharge-viva`, requireBodyDeviceToken, rechargeVivaHandler(repo));
    app.post(`/${v}/transfers/validate`, requireBodyDeviceToken, transferValidateHandler(repo));
    app.post(`/${v}/transfers/users-validate`, requireBodyDeviceToken, transferValidateHandler(repo));
    app.post(`/${v}/transfers/token/generate`, requireBodyDeviceToken, transferTokenGenerateHandler(repo));
    app.post(`/${v}/token-generate`, requireBodyDeviceToken, transferTokenGenerateHandler(repo));
    app.post(`/${v}/transfers/execute`, requireBodyDeviceToken, transferExecuteHandler(repo));
    app.post(`/${v}/transfers-execute`, requireBodyDeviceToken, transferExecuteHandler(repo));
    app.post(`/${v}/movements`, requireBodyDeviceToken, getMovementsHandler(repo));
  });

  // V2 Routes - Require header token
  v2Versions.forEach(v => {
    app.post(`/${v}/client/walletcards/information/get`, requireHeaderDeviceToken, getBalancesHandler(repo));
    app.post(`/${v}/balances`, requireHeaderDeviceToken, getBalancesHandler(repo));
    app.post(`/${v}/recharge/parameters/get`, requireHeaderDeviceToken, getRechargeParamsHandler(repo));
    app.post(`/${v}/recharge-params`, requireHeaderDeviceToken, getRechargeParamsHandler(repo));
    app.post(`/${v}/recharge/entel`, requireHeaderDeviceToken, rechargeEntelHandler(repo));
    app.post(`/${v}/recharge/tigo`, requireHeaderDeviceToken, rechargeTigoHandler(repo));
    app.post(`/${v}/recharge/viva`, requireHeaderDeviceToken, rechargeVivaHandler(repo));
    app.post(`/${v}/recharge-entel`, requireHeaderDeviceToken, rechargeEntelHandler(repo));
    app.post(`/${v}/recharge-tigo`, requireHeaderDeviceToken, rechargeTigoHandler(repo));
    app.post(`/${v}/recharge-viva`, requireHeaderDeviceToken, rechargeVivaHandler(repo));
    app.post(`/${v}/transfers/validate`, requireHeaderDeviceToken, transferValidateHandler(repo));
    app.post(`/${v}/transfers/users-validate`, requireHeaderDeviceToken, transferValidateHandler(repo));
    app.post(`/${v}/transfers/token/generate`, requireHeaderDeviceToken, transferTokenGenerateHandler(repo));
    app.post(`/${v}/token-generate`, requireHeaderDeviceToken, transferTokenGenerateHandler(repo));
    app.post(`/${v}/transfers/execute`, requireHeaderDeviceToken, transferExecuteHandler(repo));
    app.post(`/${v}/transfers-execute`, requireHeaderDeviceToken, transferExecuteHandler(repo));
    app.post(`/${v}/movements`, requireHeaderDeviceToken, getMovementsHandler(repo));
  });

  // 404 fallback
  app.use((_req, res) => {
    res.status(404).json({ state: 1, message: 'Endpoint no encontrado en Wallet Service', code: 'NOT_FOUND' });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Wallet Service Unhandled Error]', err.message);
    res.status(500).json({ state: -1, message: 'Error interno en Wallet Service', code: 'INTERNAL_SERVER_ERROR' });
  });

  return app;
}
