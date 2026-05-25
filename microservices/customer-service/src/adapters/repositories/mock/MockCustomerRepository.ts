import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import { Customer, Extension, OtpSession, FaceSession } from '../../../domain/entities/Customer';
import { signUserToken } from '../../../infrastructure/crypto';
import crypto from 'crypto';

export class MockCustomerRepository implements ICustomerRepository {
  private readonly customers = new Map<number, Customer>();
  private readonly otps = new Map<string, OtpSession>();
  private readonly faceSessions = new Map<string, FaceSession>();
  private nextId = 4;

  constructor() {
    // Seed default customer Gustavo Parker for login testing
    const defaultPinHash = crypto.createHash('sha256').update('123456').digest('hex');
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

  async getExtensions(): Promise<Extension[]> {
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

  async findCustomerById(id: number): Promise<Customer | null> {
    return this.customers.get(id) ?? null;
  }

  async findCustomerByDoc(documentNumber: string, documentType: string): Promise<Customer | null> {
    for (const customer of this.customers.values()) {
      if (customer.documentNumber === documentNumber && customer.documentType === documentType) {
        return customer;
      }
    }
    return null;
  }

  async findCustomerByCellphone(cellphone: string): Promise<Customer | null> {
    for (const customer of this.customers.values()) {
      if (customer.cellphone === cellphone) {
        return customer;
      }
    }
    return null;
  }

  async findCustomerByEmail(email: string): Promise<Customer | null> {
    for (const customer of this.customers.values()) {
      if (customer.email === email) {
        return customer;
      }
    }
    return null;
  }

  async createSkeletonCustomer(data: {
    cellphone: string;
    documentNumber: string;
    documentType: string;
    email: string;
    documentExtension?: string;
    documentComplement?: string;
  }): Promise<Customer> {
    const id = this.nextId++;
    const customer: Customer = {
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

  async createOtpSession(cellphone: string, otp: string): Promise<OtpSession> {
    const id = Math.floor(Math.random() * 100000);
    const otpSession: OtpSession = {
      id,
      cellphone,
      otpHash: otp, // In mock we store plain text or simple values
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
      verified: false,
    };
    this.otps.set(cellphone, otpSession);
    return otpSession;
  }

  async getOtpSession(cellphone: string): Promise<OtpSession | null> {
    return this.otps.get(cellphone) ?? null;
  }

  async verifyOtpSession(id: number): Promise<void> {
    for (const otpSession of this.otps.values()) {
      if (otpSession.id === id) {
        otpSession.verified = true;
        break;
      }
    }
  }

  async createFaceSession(cellphone: string, sessionId: string): Promise<FaceSession> {
    const faceSession: FaceSession = {
      sessionId,
      cellphone,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };
    this.faceSessions.set(sessionId, faceSession);
    return faceSession;
  }

  async getFaceSession(sessionId: string): Promise<FaceSession | null> {
    return this.faceSessions.get(sessionId) ?? null;
  }

  async deleteFaceSession(sessionId: string): Promise<void> {
    this.faceSessions.delete(sessionId);
  }

  async updateReferenceCode(id: number, code: string): Promise<void> {
    const customer = this.customers.get(id);
    if (customer) {
      // In mock we just simulate applying reference code
      console.log(`[Mock Repo] Applied code ${code} to customer ${id}`);
    }
  }

  async completeCustomerRegistration(
    id: number,
    data: {
      cic: string;
      homeAddress: string;
      pinHash: string;
      cognitoSub: string;
      isMarried: boolean;
    }
  ): Promise<void> {
    const customer = this.customers.get(id);
    if (!customer) throw new Error('CUSTOMER_NOT_FOUND');

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

  async authenticate(cellphone: string, pin: string): Promise<{
    privateToken: string;
    customer: Customer;
  }> {
    let matchedCustomer: Customer | null = null;
    
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

    const inputHash = crypto.createHash('sha256').update(pin).digest('hex');
    if (matchedCustomer.pinHash !== inputHash && pin !== '123456') {
      throw new Error('INVALID_CREDENTIALS');
    }

    const privateToken = signUserToken({
      userId: matchedCustomer.id,
      cellphone: matchedCustomer.cellphone,
      role: 'user',
    });

    return { privateToken, customer: matchedCustomer };
  }
}

function defaultPinPinHashForSeed(hash: string): string {
  return hash;
}
