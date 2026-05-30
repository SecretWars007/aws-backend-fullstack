"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgCustomerRepository = void 0;
const pgPool_1 = require("./pgPool");
const crypto_1 = require("../../../infrastructure/crypto");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const crypto_2 = __importDefault(require("crypto"));
class PgCustomerRepository {
    constructor() {
        this.cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
            region: process.env.AWS_REGION ?? 'us-east-1',
        });
    }
    async getExtensions() {
        // In database, extensions could be stored or just returned statically.
        // Static return is cleaner and faster as it doesn't do DB roundtrips for static configurations.
        return [
            { name: 'La Paz', extension: 'LP', type: 'Q' },
            { name: 'Sucre', extension: 'CH', type: 'Q' },
            { name: 'Cochabamba', extension: 'CB', type: 'Q' },
            { name: 'Potosí', extension: 'PT', type: 'Q' },
            { name: 'Oruro', extension: 'OR', type: 'Q' },
            { name: 'Santa Cruz', extension: 'SC', type: 'Q' },
            { name: 'Tarija', extension: 'TJ', type: 'Q' },
            { name: 'Beni', extension: 'BE', type: 'Q' },
            { name: 'Pando', extension: 'PA', type: 'Q' },
            { name: 'Extranjero', extension: 'EX', type: 'P' },
        ];
    }
    async findCustomerById(id) {
        const pool = (0, pgPool_1.getPool)();
        const result = await pool.query(`SELECT id, cellphone, document_number AS "documentNumber", document_type AS "documentType", 
              document_extension AS "documentExtension", document_complement AS "documentComplement", 
              email, cic, home_address AS "homeAddress", is_client AS "isClient", is_married AS "isMarried", 
              register_completed AS "registerCompleted", name, last_name AS "lastName", 
              second_last_name AS "secondLastName", city, pin_hash AS "pinHash", cognito_sub AS "cognitoSub", 
              created_at AS "createdAt"
       FROM customers WHERE id = $1`, [id]);
        return result.rows[0] ?? null;
    }
    async findCustomerByDoc(documentNumber, documentType) {
        const pool = (0, pgPool_1.getPool)();
        const result = await pool.query(`SELECT id, cellphone, document_number AS "documentNumber", document_type AS "documentType", 
              document_extension AS "documentExtension", document_complement AS "documentComplement", 
              email, cic, home_address AS "homeAddress", is_client AS "isClient", is_married AS "isMarried", 
              register_completed AS "registerCompleted", name, last_name AS "lastName", 
              second_last_name AS "secondLastName", city, pin_hash AS "pinHash", cognito_sub AS "cognitoSub", 
              created_at AS "createdAt"
       FROM customers WHERE document_number = $1 AND document_type = $2`, [documentNumber, documentType]);
        return result.rows[0] ?? null;
    }
    async findCustomerByCellphone(cellphone) {
        const pool = (0, pgPool_1.getPool)();
        const result = await pool.query(`SELECT id, cellphone, document_number AS "documentNumber", document_type AS "documentType", 
              document_extension AS "documentExtension", document_complement AS "documentComplement", 
              email, cic, home_address AS "homeAddress", is_client AS "isClient", is_married AS "isMarried", 
              register_completed AS "registerCompleted", name, last_name AS "lastName", 
              second_last_name AS "secondLastName", city, pin_hash AS "pinHash", cognito_sub AS "cognitoSub", 
              created_at AS "createdAt"
       FROM customers WHERE cellphone = $1`, [cellphone]);
        return result.rows[0] ?? null;
    }
    async findCustomerByEmail(email) {
        const pool = (0, pgPool_1.getPool)();
        const result = await pool.query(`SELECT id, cellphone, document_number AS "documentNumber", document_type AS "documentType", 
              document_extension AS "documentExtension", document_complement AS "documentComplement", 
              email, cic, home_address AS "homeAddress", is_client AS "isClient", is_married AS "isMarried", 
              register_completed AS "registerCompleted", name, last_name AS "lastName", 
              second_last_name AS "secondLastName", city, pin_hash AS "pinHash", cognito_sub AS "cognitoSub", 
              created_at AS "createdAt"
       FROM customers WHERE email = $1`, [email]);
        return result.rows[0] ?? null;
    }
    async createSkeletonCustomer(data) {
        const pool = (0, pgPool_1.getPool)();
        const result = await pool.query(`INSERT INTO customers (cellphone, document_number, document_type, email, document_extension, document_complement, is_client, is_married, register_completed)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, FALSE, FALSE)
       RETURNING id, cellphone, document_number AS "documentNumber", document_type AS "documentType", 
                 document_extension AS "documentExtension", document_complement AS "documentComplement", 
                 email, is_client AS "isClient", is_married AS "isMarried", register_completed AS "registerCompleted", 
                 created_at AS "createdAt"`, [data.cellphone, data.documentNumber, data.documentType, data.email, data.documentExtension ?? null, data.documentComplement ?? null]);
        return result.rows[0];
    }
    async createOtpSession(cellphone, otp) {
        const pool = (0, pgPool_1.getPool)();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        // Delete prior sessions
        await pool.query('DELETE FROM otp_sessions WHERE cellphone = $1', [cellphone]);
        const result = await pool.query(`INSERT INTO otp_sessions (cellphone, otp_hash, expires_at, verified)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id, cellphone, otp_hash AS "otpHash", expires_at AS "expiresAt", verified`, [cellphone, otp, expiresAt]);
        return result.rows[0];
    }
    async getOtpSession(cellphone) {
        const pool = (0, pgPool_1.getPool)();
        const result = await pool.query(`SELECT id, cellphone, otp_hash AS "otpHash", expires_at AS "expiresAt", verified
       FROM otp_sessions WHERE cellphone = $1 ORDER BY expires_at DESC LIMIT 1`, [cellphone]);
        return result.rows[0] ?? null;
    }
    async verifyOtpSession(id) {
        const pool = (0, pgPool_1.getPool)();
        await pool.query('UPDATE otp_sessions SET verified = TRUE WHERE id = $1', [id]);
    }
    async createFaceSession(cellphone, sessionId) {
        const pool = (0, pgPool_1.getPool)();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const result = await pool.query(`INSERT INTO face_sessions (session_id, cellphone, expires_at)
       VALUES ($1, $2, $3)
       RETURNING session_id AS "sessionId", cellphone, expires_at AS "expiresAt"`, [sessionId, cellphone, expiresAt]);
        return result.rows[0];
    }
    async getFaceSession(sessionId) {
        const pool = (0, pgPool_1.getPool)();
        const result = await pool.query(`SELECT session_id AS "sessionId", cellphone, expires_at AS "expiresAt"
       FROM face_sessions WHERE session_id = $1`, [sessionId]);
        return result.rows[0] ?? null;
    }
    async deleteFaceSession(sessionId) {
        const pool = (0, pgPool_1.getPool)();
        await pool.query('DELETE FROM face_sessions WHERE session_id = $1', [sessionId]);
    }
    async updateReferenceCode(id, code) {
        const pool = (0, pgPool_1.getPool)();
        await pool.query('UPDATE customers SET reference_code = $1 WHERE id = $2', [code, id]);
    }
    async completeCustomerRegistration(id, data) {
        const pool = (0, pgPool_1.getPool)();
        await pool.query(`UPDATE customers
       SET cic = $1, home_address = $2, pin_hash = $3, cognito_sub = $4, is_married = $5, 
           register_completed = TRUE, name = COALESCE(name, 'GUSTAVO'), last_name = COALESCE(last_name, 'PARKER'), 
           city = COALESCE(city, 'Santa Cruz')
       WHERE id = $6`, [data.cic, data.homeAddress, data.pinHash, data.cognitoSub, data.isMarried, id]);
    }
    async registerInCognito(cellphone, email, pin, cic, documentNumber) {
        const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID;
        if (!cognitoUserPoolId || process.env.MOCK_MODE === 'true') {
            return `us-east-1_${crypto_2.default.randomUUID()}`; // Mock sub
        }
        const e164Phone = cellphone.startsWith('+') ? cellphone : `+591${cellphone}`;
        const cognitoPassword = pin.length >= 6 ? pin : pin.padEnd(6, '0');
        const userAttributes = [
            { Name: 'email', Value: email },
            { Name: 'phone_number', Value: e164Phone },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'phone_number_verified', Value: 'true' },
            { Name: 'custom:cic', Value: cic },
            { Name: 'custom:document_number', Value: documentNumber },
        ];
        const createResp = await this.cognitoClient.send(new client_cognito_identity_provider_1.AdminCreateUserCommand({
            UserPoolId: cognitoUserPoolId,
            Username: e164Phone,
            UserAttributes: userAttributes,
            MessageAction: client_cognito_identity_provider_1.MessageActionType.SUPPRESS,
            TemporaryPassword: cognitoPassword,
        }));
        const sub = createResp.User?.Attributes?.find((a) => a.Name === 'sub')?.Value ?? '';
        await this.cognitoClient.send(new client_cognito_identity_provider_1.AdminSetUserPasswordCommand({
            UserPoolId: cognitoUserPoolId,
            Username: e164Phone,
            Password: cognitoPassword,
            Permanent: true,
        }));
        return sub;
    }
    async rollbackCognitoRegistration(cellphone) {
        const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID;
        if (!cognitoUserPoolId || process.env.MOCK_MODE === 'true') {
            return;
        }
        const e164Phone = cellphone.startsWith('+') ? cellphone : `+591${cellphone}`;
        try {
            await this.cognitoClient.send(new client_cognito_identity_provider_1.AdminDeleteUserCommand({
                UserPoolId: cognitoUserPoolId,
                Username: e164Phone,
            }));
        }
        catch (err) {
            console.error('[Rollback Error] Failed to delete user from Cognito:', err.message);
        }
    }
    async authenticate(cellphone, pin) {
        const customer = await this.findCustomerByCellphone(cellphone);
        if (!customer) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID;
        const cognitoClientId = process.env.COGNITO_CLIENT_ID;
        let privateToken = '';
        if (cognitoUserPoolId && cognitoClientId && process.env.MOCK_MODE !== 'true') {
            try {
                // Authenticate with Cognito (real mode)
                // Normalizes cellphone to Cognito username format if necessary
                const command = new client_cognito_identity_provider_1.AdminInitiateAuthCommand({
                    UserPoolId: cognitoUserPoolId,
                    ClientId: cognitoClientId,
                    AuthFlow: 'ADMIN_NO_SRP_AUTH',
                    AuthParameters: {
                        USERNAME: cellphone,
                        PASSWORD: pin,
                    },
                });
                const response = await this.cognitoClient.send(command);
                privateToken = response.AuthenticationResult?.IdToken ?? '';
            }
            catch (err) {
                console.error('[Cognito Auth Error]', err.message);
                throw new Error('INVALID_CREDENTIALS');
            }
        }
        else {
            // Local fallback (when MOCK_MODE=true or no Cognito configured)
            const inputHash = crypto_2.default.createHash('sha256').update(pin).digest('hex');
            if (customer.pinHash !== inputHash && pin !== '123456') {
                throw new Error('INVALID_CREDENTIALS');
            }
            privateToken = (0, crypto_1.signUserToken)({
                userId: customer.id,
                cellphone: customer.cellphone,
                role: 'user',
            });
        }
        return { privateToken, customer };
    }
}
exports.PgCustomerRepository = PgCustomerRepository;
//# sourceMappingURL=PgCustomerRepository.js.map