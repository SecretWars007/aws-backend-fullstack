"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockCustomerRepository = void 0;
const crypto_1 = require("../../../infrastructure/crypto");
const crypto_2 = __importDefault(require("crypto"));
class MockCustomerRepository {
    constructor() {
        this.customers = new Map();
        this.otps = new Map();
        this.faceSessions = new Map();
        this.nextId = 3;
        // Seed default customer Gustavo Parker for login testing
        const defaultPinHash = crypto_2.default.createHash('sha256').update('123456').digest('hex');
        this.customers.set(3, {
            id: 3,
            cellphone: '70000099',
            documentNumber: '12345678',
            documentType: 'CI',
            documentExtension: 'SC',
            email: 'usuario@gmail.com',
            cic: 'CIC12345',
            homeAddress: 'Av. Principal 123',
            isClient: false,
            isMarried: false,
            registerCompleted: true,
            name: 'GUSTAVO',
            lastName: 'PARKER',
            secondLastName: '',
            city: 'Santa Cruz',
            pinHash: defaultPinPinHashForSeed(defaultPinHash),
            cognitoSub: 'us-east-1_mock-sub-gustavo',
            createdAt: new Date(),
        });
    }
    async getExtensions() {
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
        return this.customers.get(id) ?? null;
    }
    async findCustomerByDoc(documentNumber, documentType) {
        for (const customer of this.customers.values()) {
            if (customer.documentNumber === documentNumber && customer.documentType === documentType) {
                return customer;
            }
        }
        return null;
    }
    async findCustomerByCellphone(cellphone) {
        for (const customer of this.customers.values()) {
            if (customer.cellphone === cellphone) {
                return customer;
            }
        }
        return null;
    }
    async findCustomerByEmail(email) {
        for (const customer of this.customers.values()) {
            if (customer.email === email) {
                return customer;
            }
        }
        return null;
    }
    async createSkeletonCustomer(data) {
        const id = this.nextId++;
        const customer = {
            id,
            cellphone: data.cellphone,
            documentNumber: data.documentNumber,
            documentType: data.documentType,
            documentExtension: data.documentExtension,
            documentComplement: data.documentComplement,
            email: data.email,
            isClient: false,
            isMarried: false,
            registerCompleted: false,
            createdAt: new Date(),
        };
        this.customers.set(id, customer);
        return customer;
    }
    async createOtpSession(cellphone, otp) {
        const id = Math.floor(Math.random() * 100000);
        const otpSession = {
            id,
            cellphone,
            otpHash: otp, // In mock we store plain text or simple values
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
            verified: false,
        };
        this.otps.set(cellphone, otpSession);
        return otpSession;
    }
    async getOtpSession(cellphone) {
        return this.otps.get(cellphone) ?? null;
    }
    async verifyOtpSession(id) {
        for (const otpSession of this.otps.values()) {
            if (otpSession.id === id) {
                otpSession.verified = true;
                break;
            }
        }
    }
    async createFaceSession(cellphone, sessionId) {
        const faceSession = {
            sessionId,
            cellphone,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        };
        this.faceSessions.set(sessionId, faceSession);
        return faceSession;
    }
    async getFaceSession(sessionId) {
        return this.faceSessions.get(sessionId) ?? null;
    }
    async deleteFaceSession(sessionId) {
        this.faceSessions.delete(sessionId);
    }
    async updateReferenceCode(id, code) {
        const customer = this.customers.get(id);
        if (customer) {
            // In mock we just simulate applying reference code
            console.log(`[Mock Repo] Applied code ${code} to customer ${id}`);
        }
    }
    async completeCustomerRegistration(id, data) {
        const customer = this.customers.get(id);
        if (!customer)
            throw new Error('CUSTOMER_NOT_FOUND');
        customer.cic = data.cic;
        customer.homeAddress = data.homeAddress;
        customer.pinHash = data.pinHash;
        customer.cognitoSub = data.cognitoSub;
        customer.isMarried = data.isMarried;
        customer.registerCompleted = true;
        customer.name = customer.name ?? 'GUSTAVO';
        customer.lastName = customer.lastName ?? 'PARKER';
        customer.city = customer.city ?? 'Santa Cruz';
        this.customers.set(id, customer);
    }
    async authenticate(cellphone, pin) {
        let matchedCustomer = null;
        // Normalize cellphone (remove +591 or equivalent if present, or match suffix)
        const normalizedTarget = cellphone.replace(/^\+591/, '');
        for (const c of this.customers.values()) {
            const normalizedC = c.cellphone.replace(/^\+591/, '');
            if (normalizedC === normalizedTarget) {
                matchedCustomer = c;
                break;
            }
        }
        if (!matchedCustomer) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const inputHash = crypto_2.default.createHash('sha256').update(pin).digest('hex');
        if (matchedCustomer.pinHash !== inputHash && pin !== '123456') {
            throw new Error('INVALID_CREDENTIALS');
        }
        const privateToken = (0, crypto_1.signUserToken)({
            userId: matchedCustomer.id,
            cellphone: matchedCustomer.cellphone,
            role: 'user',
        });
        return { privateToken, customer: matchedCustomer };
    }
}
exports.MockCustomerRepository = MockCustomerRepository;
function defaultPinPinHashForSeed(hash) {
    return hash;
}
//# sourceMappingURL=MockCustomerRepository.js.map