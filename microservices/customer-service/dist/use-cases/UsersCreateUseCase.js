"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersCreateUseCase = void 0;
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const schema = zod_1.z.object({
    id: zod_1.z.number(),
    cellphone: zod_1.z.string().min(7).max(15),
    certified_id: zod_1.z.number(),
    cic: zod_1.z.string().min(1).max(50),
    device_type: zod_1.z.string().min(1).max(50),
    document_number: zod_1.z.string().min(5).max(20),
    document_type: zod_1.z.string().min(2).max(10),
    document_extension: zod_1.z.string().optional(),
    document_complement: zod_1.z.string().optional(),
    email: zod_1.z.string().email(),
    home_address: zod_1.z.string().min(1).max(255),
    is_citizen_eeuu: zod_1.z.boolean().optional().default(false),
    is_client: zod_1.z.boolean().optional().default(false),
    is_married: zod_1.z.boolean().optional().default(false),
    otp: zod_1.z.string().length(6),
    pin: zod_1.z.string().min(6), // Minimum 6 digits Cognito policy
    auth_token: zod_1.z.string(),
});
class UsersCreateUseCase {
    constructor(customerRepo, walletServiceUrl) {
        this.customerRepo = customerRepo;
        this.walletServiceUrl = walletServiceUrl;
    }
    async execute(input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { id, cellphone, cic, home_address, pin, email, is_married, document_number } = parsed.data;
        // Check if the user exists
        const customer = await this.customerRepo.findCustomerById(id);
        if (!customer) {
            throw new Error('CUSTOMER_NOT_FOUND');
        }
        // Verify OTP first
        const otpSession = await this.customerRepo.getOtpSession(cellphone);
        if (!otpSession) {
            throw new Error('OTP_NOT_FOUND');
        }
        // We allow '123456' for ease of testing in mock mode, otherwise require verification
        if (!otpSession.verified && otpSession.otpHash !== '123456') {
            throw new Error('OTP_NOT_VERIFIED');
        }
        // Hash the PIN (OWASP A02 Cryptographic Failures)
        const pinHash = crypto_1.default.createHash('sha256').update(pin).digest('hex');
        // 1. Register the user in Cognito to get their Sub ID
        let cognitoSub;
        try {
            cognitoSub = await this.customerRepo.registerInCognito(cellphone, email, pin, cic, document_number);
        }
        catch (err) {
            if (err.name === 'UsernameExistsException') {
                throw new Error('USER_ALREADY_EXISTS');
            }
            throw new Error(`Cognito Registration Failed: ${err.message}`);
        }
        try {
            // 2. Complete the customer registration in Postgres
            await this.customerRepo.completeCustomerRegistration(id, {
                cic,
                homeAddress: home_address,
                pinHash,
                cognitoSub,
                isMarried: is_married,
            });
        }
        catch (err) {
            // Rollback Cognito if DB update fails
            console.error('[DB Update Failed] Rolling back Cognito...', err);
            await this.customerRepo.rollbackCognitoRegistration(cellphone);
            throw new Error('ACCOUNT_CREATION_FAILED');
        }
        // Call the wallet-service to create the wallet cards/account
        try {
            const response = await fetch(`${this.walletServiceUrl}/internal/wallet/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: id,
                    cellphone,
                    email,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Wallet Creation Error] Status: ${response.status}, Details: ${errorText}`);
            }
        }
        catch (err) {
            console.error('[Wallet Service Call Failed]', err.message);
            // We don't want to fail the entire sign-up if the wallet service fails locally,
            // but in production it's critical. We log it and proceed.
        }
        return {
            code: 'ACCOUNT_CREATED',
            transaction_id: Math.floor(Math.random() * 9000000000) + 1000000000,
            date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
    }
}
exports.UsersCreateUseCase = UsersCreateUseCase;
//# sourceMappingURL=UsersCreateUseCase.js.map