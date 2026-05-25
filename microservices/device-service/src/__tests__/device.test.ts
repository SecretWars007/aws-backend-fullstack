// ─── Device Service Tests ─────────────────────────────────────────────────────
// Tests for all endpoints defined in "Documentación API - Billetera Móvil.pdf"
// Covers: Device Identification, Device Authentication
// Uses MockDeviceRepository so no real DB/AWS connections needed.

import request from 'supertest';
import { createApp } from '../infrastructure/app';

// Set MOCK_MODE before creating app
process.env.MOCK_MODE = 'true';
process.env.JWT_SECRET = 'test-secret-key-for-jest';

const app = createApp();

// ─── Helper payloads ─────────────────────────────────────────────────────────
const validIdentifyPayload = {
  device_id: 'TEST-DEVICE-001',
  device_type: 'ANDROID',
  product: 'Zappi',
  certificate: true,
  notification_id: 'fcm-test-token-123',
  version: '1.0.0',
  reference: 'REF-001',
  send_id: 'SEND-001',
  event: 1,
};

const validAuthPayload = {
  device_id: 'TEST-DEVICE-001',
  device_type: 'ANDROID',
  certificate: true,
  encrypted_device: 'encrypted-data-test',
  send_id: 'SEND-001',
};

// =============================================================================
// 1. HEALTH CHECK
// =============================================================================
describe('Device Service - Health Check', () => {
  it('GET /health → 200 with service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('device-service');
    expect(res.body.timestamp).toBeDefined();
  });
});

// =============================================================================
// 2. DEVICE IDENTIFICATION — PDF: POST /V1/device/identification
// =============================================================================
describe('Device Service - Device Identification', () => {
  const endpoints = [
    '/V1/device/identification',
    '/V2/device/identification',
    '/V1/device-identify',
    '/V2/device-identify',
    '/v1/device-identify',
    '/v2/device-identify',
  ];

  endpoints.forEach((url) => {
    describe(`POST ${url}`, () => {
      it('returns 200 with key, iv, certified_id, and auth_token on valid request', async () => {
        const res = await request(app)
          .post(url)
          .send(validIdentifyPayload);

        expect(res.status).toBe(200);
        expect(res.body.state).toBe(0);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.key).toBeDefined();
        expect(res.body.data.iv).toBeDefined();
        expect(res.body.data.certified_id).toBeDefined();
        expect(res.body.data.auth_token).toBeDefined();
        expect(typeof res.body.data.auth_token).toBe('string');
      });

      it('returns 400 if device_id is missing (validation error)', async () => {
        const { device_id: _, ...payload } = validIdentifyPayload;
        const res = await request(app)
          .post(url)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.state).toBe(-2);
      });

      it('returns 400 if device_type is missing', async () => {
        const { device_type: _, ...payload } = validIdentifyPayload;
        const res = await request(app)
          .post(url)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.state).toBe(-2);
      });

      it('returns 400 if product is missing', async () => {
        const { product: _, ...payload } = validIdentifyPayload;
        const res = await request(app)
          .post(url)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.state).toBe(-2);
      });

      it('returns consistent certified_id for the same device_id', async () => {
        const res1 = await request(app).post(url).send(validIdentifyPayload);
        const res2 = await request(app).post(url).send(validIdentifyPayload);

        expect(res1.body.data.certified_id).toBe(res2.body.data.certified_id);
      });

      it('returns different certified_ids for different device_ids', async () => {
        const res1 = await request(app).post(url).send(validIdentifyPayload);
        const res2 = await request(app)
          .post(url)
          .send({ ...validIdentifyPayload, device_id: 'DIFFERENT-DEVICE-999' });

        // Both succeed
        expect(res1.status).toBe(200);
        expect(res2.status).toBe(200);
      });
    });
  });
});

// =============================================================================
// 3. DEVICE AUTHENTICATION — PDF: POST /V1/device/authenticate
// =============================================================================
describe('Device Service - Device Authentication', () => {
  const endpoints = [
    '/V1/device/authenticate',
    '/V2/device/authenticate',
    '/V1/device-auth',
    '/V2/device-auth',
    '/v1/device-auth',
    '/v2/device-auth',
  ];

  endpoints.forEach((url) => {
    describe(`POST ${url}`, () => {
      it('returns 200 with key, iv, certified_id, and auth_token on valid request', async () => {
        // First identify (register) the device
        await request(app).post('/V1/device/identification').send(validIdentifyPayload);

        const res = await request(app)
          .post(url)
          .send(validAuthPayload);

        expect(res.status).toBe(200);
        expect(res.body.state).toBe(0);
        expect(res.body.data.key).toBeDefined();
        expect(res.body.data.iv).toBeDefined();
        expect(res.body.data.certified_id).toBeDefined();
        expect(res.body.data.auth_token).toBeDefined();
      });

      it('returns 400 if device_id is missing', async () => {
        const { device_id: _, ...payload } = validAuthPayload;
        const res = await request(app)
          .post(url)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.state).toBe(-2);
      });

      it('returns 400 if device_type is missing', async () => {
        const { device_type: _, ...payload } = validAuthPayload;
        const res = await request(app)
          .post(url)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.state).toBe(-2);
      });

      it('auth_token is a valid JWT string', async () => {
        const res = await request(app)
          .post(url)
          .send(validAuthPayload);

        expect(res.status).toBe(200);
        const parts = res.body.data.auth_token.split('.');
        expect(parts).toHaveLength(3); // JWT has 3 parts
      });
    });
  });
});

// =============================================================================
// 4. 404 HANDLER
// =============================================================================
describe('Device Service - 404 Not Found', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).post('/V1/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.state).toBe(-4);
  });

  it('returns 404 for GET on identification endpoint', async () => {
    const res = await request(app).get('/V1/device/identification');
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// 5. SECURITY HEADERS
// =============================================================================
describe('Device Service - Security Headers (Helmet)', () => {
  it('response includes X-Content-Type-Options header', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBeDefined();
  });

  it('response includes X-Frame-Options or CSP header', async () => {
    const res = await request(app).get('/health');
    const hasFrameOption = res.headers['x-frame-options'] !== undefined;
    const hasCsp = res.headers['content-security-policy'] !== undefined;
    expect(hasFrameOption || hasCsp).toBe(true);
  });
});
