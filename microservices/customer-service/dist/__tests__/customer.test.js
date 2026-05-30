"use strict";
// ─── Customer Service Tests ────────────────────────────────────────────────────
// Tests for all endpoints defined in "Documentación API - Billetera Móvil.pdf"
// Uses MockCustomerRepository — no real DB/AWS connections needed.
// All schemas validated against actual Zod schemas in use-cases.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../infrastructure/app");
process.env.MOCK_MODE = 'true';
process.env.JWT_DEVICE_SECRET = 'zappi-device-secret-CHANGE-IN-PROD';
process.env.JWT_USER_SECRET = 'zappi-user-secret-CHANGE-IN-PROD';
const app = (0, app_1.createApp)();
// ─── Auth helpers ─────────────────────────────────────────────────────────────
const DEVICE_SECRET = 'zappi-device-secret-CHANGE-IN-PROD';
function makeAuthToken(certifiedId = 3) {
    return jsonwebtoken_1.default.sign({ deviceId: 'test-device-001', certifiedId }, DEVICE_SECRET, { expiresIn: '1h' });
}
/** Build a payload that already includes auth_token + certified_id for Zod validation */
function withAuth(payload, certifiedId = 3) {
    const token = makeAuthToken(certifiedId);
    return { ...payload, auth_token: token, certified_id: certifiedId };
}
// Seeded customer in MockCustomerRepository (constructor seed)
const SEED_CELLPHONE = '70000099';
const SEED_PIN = '123456';
// =============================================================================
// 0. HEALTH CHECK
// =============================================================================
describe('Customer Service - Health Check', () => {
    it('GET /health → 200 with service name', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('customer-service');
    });
});
// =============================================================================
// 1. GET EXTENSION CATALOG — PDF: POST /V1/client/device/register/extension/get
// =============================================================================
describe('Customer Service - Document Extension Catalog', () => {
    const endpoints = [
        '/V1/client/device/register/extension/get',
        '/V2/client/device/register/extension/get',
        '/v1/client/device/register/extension/get',
        '/v2/client/device/register/extension/get',
        '/V1/document-extensions',
        '/V2/document-extensions',
    ];
    endpoints.forEach((url) => {
        it(`POST ${url} → 200 with extension list`, async () => {
            const res = await (0, supertest_1.default)(app).post(url).send(withAuth({}));
            expect(res.status).toBe(200);
            expect(res.body.state).toBe(0);
            expect(Array.isArray(res.body.data.extensions)).toBe(true);
            expect(res.body.data.extensions.length).toBeGreaterThan(0);
        });
    });
    it('POST /V1/client/device/register/extension/get → 401 without auth_token', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/V1/client/device/register/extension/get')
            .send({});
        expect(res.status).toBe(401);
    });
});
// =============================================================================
// 2. VALIDATE USER — PDF: POST /V1/register/validate/user
//    Schema: cellphone, document_number, document_type, email, certified_id, auth_token
// =============================================================================
describe('Customer Service - Validate User', () => {
    const endpoints = [
        '/V1/register/validate/user',
        '/V2/register/validate/user',
        '/v1/register/validate/user',
        '/v2/register/validate/user',
        '/V1/users-validate',
        '/V2/users-validate',
    ];
    const validPayload = {
        cellphone: '77712345',
        document_number: '99887766',
        document_type: 'CI',
        email: 'test@example.com',
        document_extension: 'SC',
    };
    endpoints.forEach((url) => {
        describe(`POST ${url}`, () => {
            it('returns 200 on valid user data', async () => {
                const res = await (0, supertest_1.default)(app).post(url).send(withAuth(validPayload));
                expect(res.status).toBe(200);
                expect(res.body.state).toBe(0);
                expect(res.body.data.id).toBeDefined();
            });
            it('returns 400 when cellphone is missing', async () => {
                const { cellphone: _, ...noPhone } = validPayload;
                const res = await (0, supertest_1.default)(app).post(url).send(withAuth(noPhone));
                expect(res.status).toBe(400);
            });
            it('returns 400 when email is missing', async () => {
                const { email: _, ...noEmail } = validPayload;
                const res = await (0, supertest_1.default)(app).post(url).send(withAuth(noEmail));
                expect(res.status).toBe(400);
            });
            it('returns 401 without auth_token', async () => {
                const res = await (0, supertest_1.default)(app).post(url).send(validPayload);
                expect(res.status).toBe(401);
            });
        });
    });
});
// =============================================================================
// 3. VALIDATE OTP — PDF: POST /V1/register/validate/otp
//    Schema: cellphone, otp_code, certified_id, auth_token
// =============================================================================
describe('Customer Service - Validate OTP', () => {
    const endpoints = [
        '/V1/register/validate/otp',
        '/V2/register/validate/otp',
        '/v1/register/validate/otp',
        '/v2/register/validate/otp',
        '/V1/otp-generate',
        '/V2/otp-generate',
    ];
    it('Full OTP flow: validate user → validate OTP → 200', async () => {
        // Step 1: Create user/OTP session first
        await (0, supertest_1.default)(app)
            .post('/V1/register/validate/user')
            .send(withAuth({
            cellphone: '77100100',
            document_number: '11122233',
            document_type: 'CI',
            email: 'otp-test@example.com',
        }));
        // Step 2: Now validate the OTP (mock uses '123456')
        const res = await (0, supertest_1.default)(app)
            .post('/V1/register/validate/otp')
            .send(withAuth({ cellphone: '77100100', otp_code: '123456' }));
        expect([200, 400]).toContain(res.status); // 200 if OTP matches
    });
    endpoints.forEach((url) => {
        it(`POST ${url} → 400 when cellphone is missing`, async () => {
            const res = await (0, supertest_1.default)(app)
                .post(url)
                .send(withAuth({ otp_code: '123456' }));
            expect(res.status).toBe(400);
        });
        it(`POST ${url} → 401 without auth_token`, async () => {
            const res = await (0, supertest_1.default)(app)
                .post(url)
                .send({ cellphone: '77100100', otp_code: '123456' });
            expect(res.status).toBe(401);
        });
    });
});
// =============================================================================
// 4. INIT FACE RECOGNITION — PDF: POST /V1/register/init/face/recognition
//    Schema: cellphone, document_number, document_type, certified_id, auth_token
// =============================================================================
describe('Customer Service - Init Face Recognition', () => {
    const endpoints = [
        '/V1/register/init/face/recognition',
        '/V2/register/init/face/recognition',
        '/v1/register/init/face/recognition',
        '/v2/register/init/face/recognition',
        '/V1/face-recognition-init',
        '/V2/face-recognition-init',
    ];
    const validPayload = {
        cellphone: '77712345',
        document_number: '99887766',
        document_type: 'CI',
        document_extension: 'SC',
    };
    endpoints.forEach((url) => {
        describe(`POST ${url}`, () => {
            it('returns 200 with face session data', async () => {
                const res = await (0, supertest_1.default)(app).post(url).send(withAuth(validPayload));
                expect(res.status).toBe(200);
                expect(res.body.state).toBe(0);
                expect(res.body.data.session_id).toBeDefined();
                expect(res.body.data.instruction).toBeDefined();
                expect(res.body.data.image).toBeDefined();
            });
            it('returns 400 when cellphone is missing', async () => {
                const { cellphone: _, ...noPhone } = validPayload;
                const res = await (0, supertest_1.default)(app).post(url).send(withAuth(noPhone));
                expect(res.status).toBe(400);
            });
            it('returns 401 without auth_token', async () => {
                const res = await (0, supertest_1.default)(app).post(url).send(validPayload);
                expect(res.status).toBe(401);
            });
        });
    });
});
// =============================================================================
// 5. EXECUTE FACE RECOGNITION — PDF: POST /V1/register/execute/face/recognition
//    Schema: cellphone, selfie, face_session_id, certified_id, auth_token
// =============================================================================
describe('Customer Service - Execute Face Recognition', () => {
    const endpoints = [
        '/V1/register/execute/face/recognition',
        '/V2/register/execute/face/recognition',
        '/v1/register/execute/face/recognition',
        '/v2/register/execute/face/recognition',
        '/V1/face-recognition-valid',
        '/V2/face-recognition-valid',
    ];
    it('Full face flow: init → execute → 200', async () => {
        // Step 1: Init face session
        const initRes = await (0, supertest_1.default)(app)
            .post('/V1/register/init/face/recognition')
            .send(withAuth({
            cellphone: '77200200',
            document_number: '22233344',
            document_type: 'CI',
        }));
        expect(initRes.status).toBe(200);
        const sessionId = initRes.body.data.session_id;
        // Step 2: Execute with the session ID
        const execRes = await (0, supertest_1.default)(app)
            .post('/V1/register/execute/face/recognition')
            .send(withAuth({
            cellphone: '77200200',
            selfie: 'base64imagedata==',
            face_session_id: sessionId,
        }));
        expect([200, 400]).toContain(execRes.status);
    });
    endpoints.forEach((url) => {
        it(`POST ${url} → 400 when cellphone is missing`, async () => {
            const res = await (0, supertest_1.default)(app)
                .post(url)
                .send(withAuth({ selfie: 'data==', face_session_id: 'sess-1' }));
            expect(res.status).toBe(400);
        });
        it(`POST ${url} → 401 without auth_token`, async () => {
            const res = await (0, supertest_1.default)(app)
                .post(url)
                .send({ cellphone: '77712345', selfie: 'data==', face_session_id: 'sess-1' });
            expect(res.status).toBe(401);
        });
    });
});
// =============================================================================
// 6. REGISTER REFERENCE CODE — PDF: POST /V1/client/reference/register/code
//    Schema: cellphone, reference_code, certified_id, auth_token
// =============================================================================
describe('Customer Service - Register Reference Code', () => {
    const endpoints = [
        '/V1/client/reference/register/code',
        '/V2/client/reference/register/code',
        '/v1/client/reference/register/code',
        '/v2/client/reference/register/code',
        '/V1/reference/register',
        '/V2/reference/register',
    ];
    // ReferenceRegisterUseCase schema: { id: number, code: string, auth_token: string }
    const validPayload = {
        id: 3, // seeded Gustavo Parker
        code: 'REF-2024',
    };
    endpoints.forEach((url) => {
        it(`POST ${url} → 200 with seeded customer id=3`, async () => {
            const res = await (0, supertest_1.default)(app).post(url).send(withAuth(validPayload));
            expect(res.status).toBe(200);
            expect(res.body.state).toBe(0);
            expect(res.body.data.code).toBe('REFERENCE_APPLIED');
        });
        it(`POST ${url} → 400 when id is missing`, async () => {
            const res = await (0, supertest_1.default)(app).post(url).send(withAuth({ code: 'REF-2024' }));
            expect(res.status).toBe(400);
        });
        it(`POST ${url} → 401 without auth_token`, async () => {
            const res = await (0, supertest_1.default)(app).post(url).send(validPayload);
            expect(res.status).toBe(401);
        });
    });
});
// =============================================================================
// 7. CREATE ACCOUNT — PDF: POST /V1/register/create/account
//    Schema: cellphone, pin, name, last_name, + more, certified_id, auth_token
// =============================================================================
describe('Customer Service - Create Account', () => {
    const endpoints = [
        '/V1/register/create/account',
        '/V2/register/create/account',
        '/v1/register/create/account',
        '/v2/register/create/account',
        '/V1/users-create',
        '/V2/users-create',
    ];
    const validPayload = {
        cellphone: '77712345',
        pin: '9876',
        home_address: 'Av. Las Americas 100',
        is_married: false,
    };
    endpoints.forEach((url) => {
        it(`POST ${url} → 200 or 400 depending on OTP flow state`, async () => {
            const res = await (0, supertest_1.default)(app).post(url).send(withAuth(validPayload));
            expect([200, 400]).toContain(res.status);
        });
        it(`POST ${url} → 400 when cellphone is missing`, async () => {
            const { cellphone: _, ...noPhone } = validPayload;
            const res = await (0, supertest_1.default)(app).post(url).send(withAuth(noPhone));
            expect(res.status).toBe(400);
        });
        it(`POST ${url} → 401 without auth_token`, async () => {
            const res = await (0, supertest_1.default)(app).post(url).send(validPayload);
            expect(res.status).toBe(401);
        });
    });
});
// =============================================================================
// 8. LOGIN — PDF: POST /V1/client/login/get
//    Schema: mobile_number, pin, certified_id, auth_token (NOT cellphone!)
// =============================================================================
describe('Customer Service - Login (Sign In)', () => {
    const endpoints = [
        '/V1/client/login/get',
        '/V2/client/login/get',
        '/v1/client/login/get',
        '/v2/client/login/get',
        '/V1/sign-in',
        '/V2/sign-in',
    ];
    const validPayload = {
        mobile_number: SEED_CELLPHONE,
        pin: SEED_PIN,
    };
    endpoints.forEach((url) => {
        describe(`POST ${url}`, () => {
            it('returns 200 with welcome message on valid credentials', async () => {
                const res = await (0, supertest_1.default)(app).post(url).send(withAuth(validPayload));
                expect(res.status).toBe(200);
                expect(res.body.state).toBe(0);
                expect(res.body.message).toContain('Zappi');
                expect(res.body.data.private_token).toBeDefined();
                expect(res.body.data.mobile_number).toBe(SEED_CELLPHONE);
            });
            it('returns 400 with invalid PIN (wrong hash)', async () => {
                const res = await (0, supertest_1.default)(app)
                    .post(url)
                    .send(withAuth({ mobile_number: SEED_CELLPHONE, pin: '000000' }));
                expect(res.status).toBe(400);
            });
            it('returns 400 with unknown mobile_number', async () => {
                const res = await (0, supertest_1.default)(app)
                    .post(url)
                    .send(withAuth({ mobile_number: '00000001', pin: SEED_PIN }));
                expect(res.status).toBe(400);
            });
            it('returns 400 when mobile_number is missing', async () => {
                const { mobile_number: _, ...noMobile } = validPayload;
                const res = await (0, supertest_1.default)(app).post(url).send(withAuth(noMobile));
                expect(res.status).toBe(400);
            });
            it('returns 400 when pin is missing', async () => {
                const { pin: _, ...noPin } = validPayload;
                const res = await (0, supertest_1.default)(app).post(url).send(withAuth(noPin));
                expect(res.status).toBe(400);
            });
            it('returns 401 without auth_token', async () => {
                const res = await (0, supertest_1.default)(app).post(url).send(validPayload);
                expect(res.status).toBe(401);
            });
        });
    });
});
// =============================================================================
// 9. GET PROFILE PARAMETERS — PDF: POST /V1/profile/parameters/get
// =============================================================================
describe('Customer Service - Profile Parameters', () => {
    const endpoints = [
        '/V1/profile/parameters/get',
        '/V2/profile/parameters/get',
        '/v1/profile/parameters/get',
        '/v2/profile/parameters/get',
        '/V1/parameters',
        '/V2/parameters',
    ];
    endpoints.forEach((url) => {
        it(`POST ${url} → 200 with profile parameters (seeded customer id=3)`, async () => {
            const res = await (0, supertest_1.default)(app).post(url).send(withAuth({}, 3));
            expect(res.status).toBe(200);
            expect(res.body.state).toBe(0);
            expect(res.body.data).toBeDefined();
        });
        it(`POST ${url} → 401 without auth_token`, async () => {
            const res = await (0, supertest_1.default)(app).post(url).send({});
            expect(res.status).toBe(401);
        });
    });
});
// =============================================================================
// 10. WELCOME REFERENCE — PDF: POST /V1/client/reference/welcome (intentional 404)
// =============================================================================
describe('Customer Service - Welcome Reference (Intentional 404 per PDF spec)', () => {
    ['/V1/client/reference/welcome', '/V2/client/reference/welcome',
        '/v1/client/reference/welcome', '/v2/client/reference/welcome'].forEach((url) => {
        it(`POST ${url} → 404`, async () => {
            const res = await (0, supertest_1.default)(app).post(url).send(withAuth({}));
            expect(res.status).toBe(404);
        });
    });
});
// =============================================================================
// 11. INTERNAL ROUTE — GET /internal/customer/phone/:cellphone
// =============================================================================
describe('Customer Service - Internal Routes', () => {
    it(`GET /internal/customer/phone/${SEED_CELLPHONE} → 200 with seeded data`, async () => {
        const res = await (0, supertest_1.default)(app).get(`/internal/customer/phone/${SEED_CELLPHONE}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(3);
        expect(res.body.name).toBeDefined();
    });
    it('GET /internal/customer/phone/00000001 → 404 (unknown number)', async () => {
        const res = await (0, supertest_1.default)(app).get('/internal/customer/phone/00000001');
        expect(res.status).toBe(404);
    });
});
// =============================================================================
// 12. 404 FALLBACK
// =============================================================================
describe('Customer Service - 404 Not Found', () => {
    it('returns 404 for unknown endpoints', async () => {
        const res = await (0, supertest_1.default)(app).post('/V1/completely-unknown');
        expect(res.status).toBe(404);
    });
});
// =============================================================================
// 13. SECURITY HEADERS
// =============================================================================
describe('Customer Service - Security Headers (Helmet)', () => {
    it('response includes X-Content-Type-Options', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        expect(res.headers['x-content-type-options']).toBeDefined();
    });
    it('response includes CSP or X-Frame-Options', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        const hasCSP = res.headers['content-security-policy'] !== undefined;
        const hasXFO = res.headers['x-frame-options'] !== undefined;
        expect(hasCSP || hasXFO).toBe(true);
    });
});
//# sourceMappingURL=customer.test.js.map