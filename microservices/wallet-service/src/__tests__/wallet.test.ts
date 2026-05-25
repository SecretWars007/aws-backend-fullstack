// ─── Wallet Service Tests ─────────────────────────────────────────────────────
// Tests for all endpoints defined in "Documentación API - Billetera Móvil.pdf"
// Uses MockWalletRepository — no real DB/AWS connections needed.
// All field names validated against actual Zod schemas in use-cases.

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../infrastructure/app';

process.env.MOCK_MODE = 'true';
process.env.JWT_DEVICE_SECRET = 'zappi-device-secret-CHANGE-IN-PROD';

const app = createApp();

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function makeAuthToken(certifiedId = 3) {
  return jwt.sign(
    { deviceId: 'test-device-001', certifiedId },
    'zappi-device-secret-CHANGE-IN-PROD',
    { expiresIn: '1h' }
  );
}

function withAuth(payload: object, certifiedId = 3) {
  return { ...payload, auth_token: makeAuthToken(certifiedId) };
}

// =============================================================================
// 0. HEALTH CHECK
// =============================================================================
describe('Wallet Service - Health Check', () => {
  it('GET /health → 200 with service name', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('wallet-service');
    expect(res.body.timestamp).toBeDefined();
  });
});

// =============================================================================
// 1. GET WALLET BALANCES — PDF: POST /V1/client/walletcards/information/get
// =============================================================================
describe('Wallet Service - Wallet Balances', () => {
  const endpoints = [
    '/V1/client/walletcards/information/get',
    '/V2/client/walletcards/information/get',
    '/v1/client/walletcards/information/get',
    '/v2/client/walletcards/information/get',
    '/V1/balances',
    '/V2/balances',
  ];

  endpoints.forEach((url) => {
    describe(`POST ${url}`, () => {
      it('returns 200 with wallet_cards array (certifiedId=3 is Gustavo Parker)', async () => {
        const res = await request(app).post(url).send(withAuth({}, 3));
        expect(res.status).toBe(200);
        expect(res.body.state).toBe(0);
        expect(res.body.data.wallet_cards).toBeDefined();
        expect(Array.isArray(res.body.data.wallet_cards)).toBe(true);
        expect(res.body.data.wallet_cards.length).toBeGreaterThan(0);
        expect(res.body.data.wallet_cards[0].balance).toBe(1250.50);
      });

      it('returns 401 without auth_token', async () => {
        const res = await request(app).post(url).send({});
        expect(res.status).toBe(401);
      });
    });
  });
});

// =============================================================================
// 2. RECHARGE PARAMETERS — PDF: POST /V1/recharge/parameters/get
// =============================================================================
describe('Wallet Service - Recharge Parameters', () => {
  const endpoints = [
    '/V1/recharge/parameters/get',
    '/V2/recharge/parameters/get',
    '/v1/recharge/parameters/get',
    '/v2/recharge/parameters/get',
    '/V1/recharge-params',
    '/V2/recharge-params',
  ];

  endpoints.forEach((url) => {
    it(`POST ${url} → 200 with providers list`, async () => {
      const res = await request(app).post(url).send(withAuth({}));
      expect(res.status).toBe(200);
      expect(res.body.state).toBe(0);
      expect(Array.isArray(res.body.data.providers)).toBe(true);
      expect(res.body.data.providers.length).toBeGreaterThanOrEqual(3); // Entel, Tigo, Viva
    });
  });
});

// =============================================================================
// 3. RECHARGE ENTEL — PDF: POST /V1/recharge/entel
//    Schema: cellphone, amount (uses `cellphone` not `phone_number`!)
// =============================================================================
describe('Wallet Service - Recharge Entel', () => {
  const endpoints = [
    '/V1/recharge/entel',
    '/V2/recharge/entel',
    '/v1/recharge/entel',
    '/v2/recharge/entel',
    '/V1/recharge-entel',
    '/V2/recharge-entel',
  ];

  const validPayload = { cellphone: '71234567', amount: 20 };

  endpoints.forEach((url) => {
    describe(`POST ${url}`, () => {
      it('returns 200 on valid Entel recharge', async () => {
        const res = await request(app).post(url).send(withAuth(validPayload, 3));
        expect(res.status).toBe(200);
        expect(res.body.state).toBe(0);
        expect(res.body.message).toContain('Entel');
        expect(res.body.data.transaction_id).toBeDefined();
      });

      it('returns 400 on missing cellphone', async () => {
        const res = await request(app).post(url).send(withAuth({ amount: 20 }));
        expect(res.status).toBe(400);
      });

      it('returns 400 on missing amount', async () => {
        const res = await request(app).post(url).send(withAuth({ cellphone: '71234567' }));
        expect(res.status).toBe(400);
      });

      it('returns 401 without auth_token', async () => {
        const res = await request(app).post(url).send(validPayload);
        expect(res.status).toBe(401);
      });
    });
  });
});

// =============================================================================
// 4. RECHARGE TIGO — PDF: POST /V1/recharge/tigo
// =============================================================================
describe('Wallet Service - Recharge Tigo', () => {
  const endpoints = [
    '/V1/recharge/tigo',
    '/V2/recharge/tigo',
    '/v1/recharge/tigo',
    '/v2/recharge/tigo',
    '/V1/recharge-tigo',
    '/V2/recharge-tigo',
  ];

  const validPayload = { cellphone: '72345678', amount: 15 };

  endpoints.forEach((url) => {
    describe(`POST ${url}`, () => {
      it('returns 200 on valid Tigo recharge', async () => {
        const res = await request(app).post(url).send(withAuth(validPayload, 3));
        expect(res.status).toBe(200);
        expect(res.body.state).toBe(0);
        expect(res.body.message).toContain('Tigo');
      });

      it('returns 400 on missing cellphone', async () => {
        const res = await request(app).post(url).send(withAuth({ amount: 15 }));
        expect(res.status).toBe(400);
      });

      it('returns 401 without auth_token', async () => {
        const res = await request(app).post(url).send(validPayload);
        expect(res.status).toBe(401);
      });
    });
  });
});

// =============================================================================
// 5. RECHARGE VIVA — PDF: POST /V1/recharge/viva
// =============================================================================
describe('Wallet Service - Recharge Viva', () => {
  const endpoints = [
    '/V1/recharge/viva',
    '/V2/recharge/viva',
    '/v1/recharge/viva',
    '/v2/recharge/viva',
    '/V1/recharge-viva',
    '/V2/recharge-viva',
  ];

  const validPayload = { cellphone: '73456789', amount: 10 };

  endpoints.forEach((url) => {
    describe(`POST ${url}`, () => {
      it('returns 200 on valid Viva recharge', async () => {
        const res = await request(app).post(url).send(withAuth(validPayload, 3));
        expect(res.status).toBe(200);
        expect(res.body.state).toBe(0);
        expect(res.body.message).toContain('Viva');
      });

      it('returns 400 on missing amount', async () => {
        const res = await request(app).post(url).send(withAuth({ cellphone: '73456789' }));
        expect(res.status).toBe(400);
      });

      it('returns 401 without auth_token', async () => {
        const res = await request(app).post(url).send(validPayload);
        expect(res.status).toBe(401);
      });
    });
  });
});

// =============================================================================
// 6. TRANSFER VALIDATE — PDF: POST /V1/transfers/validate
//    Schema: cellphone (of recipient)
// =============================================================================
describe('Wallet Service - Transfer Validate', () => {
  const endpoints = [
    '/V1/transfers/validate',
    '/V2/transfers/validate',
    '/v1/transfers/validate',
    '/v2/transfers/validate',
    '/V1/transfers/users-validate',
    '/V2/transfers/users-validate',
  ];

  endpoints.forEach((url) => {
    describe(`POST ${url}`, () => {
      it('returns 200 when recipient exists (starts with 7 in mock)', async () => {
        const res = await request(app)
          .post(url)
          .send(withAuth({ cellphone: '70000099' })); // seeded customer
        expect(res.status).toBe(200);
        expect(res.body.state).toBe(0);
        expect(res.body.data.name).toBe('GUSTAVO PARKER');
      });

      it('returns 400 when cellphone is missing', async () => {
        const res = await request(app).post(url).send(withAuth({}));
        expect(res.status).toBe(400);
      });

      it('returns 401 without auth_token', async () => {
        const res = await request(app).post(url).send({ cellphone: '70000099' });
        expect(res.status).toBe(401);
      });
    });
  });
});

// =============================================================================
// 7. TRANSFER TOKEN GENERATE — PDF: POST /V1/transfers/token/generate
//    Schema: cellphone, amount
// =============================================================================
describe('Wallet Service - Transfer Token Generate', () => {
  const endpoints = [
    '/V1/transfers/token/generate',
    '/V2/transfers/token/generate',
    '/v1/transfers/token/generate',
    '/v2/transfers/token/generate',
    '/V1/token-generate',
    '/V2/token-generate',
  ];

  const validPayload = { cellphone: '70000099', amount: 50 };

  endpoints.forEach((url) => {
    describe(`POST ${url}`, () => {
      it('returns 200 with transfer token', async () => {
        const res = await request(app).post(url).send(withAuth(validPayload, 3));
        expect(res.status).toBe(200);
        expect(res.body.state).toBe(0);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.token).toHaveLength(6); // 6-digit token
      });

      it('returns 400 when cellphone is missing', async () => {
        const res = await request(app).post(url).send(withAuth({ amount: 50 }));
        expect(res.status).toBe(400);
      });

      it('returns 400 when amount is missing', async () => {
        const res = await request(app).post(url).send(withAuth({ cellphone: '70000099' }));
        expect(res.status).toBe(400);
      });

      it('returns 401 without auth_token', async () => {
        const res = await request(app).post(url).send(validPayload);
        expect(res.status).toBe(401);
      });
    });
  });
});

// =============================================================================
// 8. TRANSFER EXECUTE — PDF: POST /V1/transfers/execute
// =============================================================================
describe('Wallet Service - Transfer Execute', () => {
  const endpoints = [
    '/V1/transfers/execute',
    '/V2/transfers/execute',
    '/v1/transfers/execute',
    '/v2/transfers/execute',
    '/V1/transfers-execute',
    '/V2/transfers-execute',
  ];

  it('Full transfer flow: token generate → execute → 200', async () => {
    // Step 1: Generate token
    const tokenRes = await request(app)
      .post('/V1/transfers/token/generate')
      .send(withAuth({ cellphone: '70000099', amount: 50 }, 3));
    expect(tokenRes.status).toBe(200);
    const token = tokenRes.body.data.token;

    // Step 2: Execute transfer using generated token
    const execRes = await request(app)
      .post('/V1/transfers/execute')
      .send(withAuth({ cellphone: '70000099', amount: 50, token }, 3));
    expect(execRes.status).toBe(200);
    expect(execRes.body.state).toBe(0);
    expect(execRes.body.message).toContain('éxito');
  });

  endpoints.forEach((url) => {
    it(`POST ${url} → 400 when token is missing`, async () => {
      const res = await request(app)
        .post(url)
        .send(withAuth({ cellphone: '70000099', amount: 50 }));
      expect(res.status).toBe(400);
    });

    it(`POST ${url} → 401 without auth_token`, async () => {
      const res = await request(app)
        .post(url)
        .send({ cellphone: '70000099', amount: 50, token: '123456' });
      expect(res.status).toBe(401);
    });
  });
});

// =============================================================================
// 9. MOVEMENTS — PDF: POST /V1/movements
// =============================================================================
describe('Wallet Service - Movements History', () => {
  const endpoints = [
    '/V1/movements',
    '/V2/movements',
    '/v1/movements',
    '/v2/movements',
  ];

  endpoints.forEach((url) => {
    describe(`POST ${url}`, () => {
      it('returns 200 with balance and movements list', async () => {
        const res = await request(app).post(url).send(withAuth({}, 3));
        expect(res.status).toBe(200);
        expect(res.body.state).toBe(0);
        expect(res.body.data.balance).toBeDefined();
        expect(Array.isArray(res.body.data.movements)).toBe(true);
      });

      it('returns 401 without auth_token', async () => {
        const res = await request(app).post(url).send({});
        expect(res.status).toBe(401);
      });
    });
  });
});

// =============================================================================
// 10. INTERNAL — POST /internal/wallet/create
// =============================================================================
describe('Wallet Service - Internal Wallet Create', () => {
  it('POST /internal/wallet/create → 201 with valid payload', async () => {
    const res = await request(app)
      .post('/internal/wallet/create')
      .send({ customerId: 5, cellphone: '77799900' });
    expect(res.status).toBe(201);
  });

  it('POST /internal/wallet/create → 400 when customerId is missing', async () => {
    const res = await request(app)
      .post('/internal/wallet/create')
      .send({ cellphone: '77799900' });
    expect(res.status).toBe(400);
  });

  it('POST /internal/wallet/create → 400 when cellphone is missing', async () => {
    const res = await request(app)
      .post('/internal/wallet/create')
      .send({ customerId: 5 });
    expect(res.status).toBe(400);
  });
});

// =============================================================================
// 11. 404 FALLBACK
// =============================================================================
describe('Wallet Service - 404 Not Found', () => {
  it('returns 404 for unknown endpoints', async () => {
    const res = await request(app).post('/V1/completely-unknown-endpoint');
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// 12. SECURITY HEADERS
// =============================================================================
describe('Wallet Service - Security Headers (Helmet)', () => {
  it('response includes X-Content-Type-Options', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBeDefined();
  });

  it('response includes CSP or X-Frame-Options', async () => {
    const res = await request(app).get('/health');
    const hasCSP = res.headers['content-security-policy'] !== undefined;
    const hasXFO = res.headers['x-frame-options'] !== undefined;
    expect(hasCSP || hasXFO).toBe(true);
  });
});
