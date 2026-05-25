// ─── Express Application Setup ────────────────────────────────────────────────
// Configures all global middleware (OWASP security headers, CORS, rate limiting)
// and registers all routes with their repository injection.

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { IDeviceRepository } from '../domain/repositories/IDeviceRepository';
import { MockDeviceRepository } from '../adapters/repositories/mock/MockDeviceRepository';
import { PgDeviceRepository } from '../adapters/repositories/postgres/PgDeviceRepository';
import { deviceIdentifyHandler, deviceAuthHandler } from '../adapters/controllers/deviceControllers';

// ─── Repository selection based on MOCK_MODE env var ─────────────────────────
function buildRepository(): IDeviceRepository {
  const isMock = process.env.MOCK_MODE === 'true';
  console.log(`[Device Service] Running in ${isMock ? 'MOCK' : 'PRODUCTION'} mode`);
  return isMock ? new MockDeviceRepository() : new PgDeviceRepository();
}

export function createApp(): express.Application {
  const app = express();
  const repo = buildRepository();

  // ── OWASP A05: Security Misconfiguration — Helmet sets secure headers ──────
  app.use(helmet());

  // ── CORS — only allow known origins in production ─────────────────────────
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Token'],
  }));

  // ── Body parser with size limit (OWASP A05) ──────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // ── OWASP A07: Rate Limiting — 100 requests per minute per IP (10k in test mode) ────────────
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 10_000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { state: -5, message: 'Demasiadas solicitudes. Intente más tarde.', data: null },
  });
  app.use(limiter);

  // ── Request logging (correlation ID, no PII) ──────────────────────────────
  app.use((req, _res, next) => {
    const id = req.headers['x-request-id'] ?? crypto.randomUUID?.() ?? Date.now();
    console.log(`[${id}] ${req.method} ${req.path}`);
    next();
  });

  // ── Health check (used by ALB and ECS) ───────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'device-service', timestamp: new Date().toISOString() });
  });

  // ── Device Routes ─────────────────────────────────────────────────────────
  // POST /V1/device/identification & /V2/device/identification — No auth required (first contact)
  app.post('/V1/device/identification', deviceIdentifyHandler(repo));
  app.post('/V2/device/identification', deviceIdentifyHandler(repo));
  app.post('/V1/device-identify', deviceIdentifyHandler(repo));
  app.post('/V2/device-identify', deviceIdentifyHandler(repo));
  app.post('/v1/device-identify', deviceIdentifyHandler(repo));
  app.post('/v2/device-identify', deviceIdentifyHandler(repo));

  // POST /V1/device/authenticate & /V2/device/authenticate — No device token required (re-authentication)
  app.post('/V1/device/authenticate', deviceAuthHandler(repo));
  app.post('/V2/device/authenticate', deviceAuthHandler(repo));
  app.post('/V1/device-auth', deviceAuthHandler(repo));
  app.post('/V2/device-auth', deviceAuthHandler(repo));
  app.post('/v1/device-auth', deviceAuthHandler(repo));
  app.post('/v2/device-auth', deviceAuthHandler(repo));

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ state: -4, message: 'Endpoint no encontrado', data: null });
  });

  // ── Global error handler ──────────────────────────────────────────────────
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Unhandled Error]', err.message);
    res.status(500).json({ state: -99, message: 'Error interno del servidor', data: null });
  });

  return app;
}
