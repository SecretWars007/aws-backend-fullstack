// ─── Customer Repository Interface ──────────────────────────────────────────
// Defines the contract for Customer and authentication operations.

import { Customer, Extension, OtpSession, FaceSession } from '../entities/Customer';

export interface ICustomerRepository {
  getExtensions(): Promise<Extension[]>;
  
  findCustomerById(id: number): Promise<Customer | null>;
  findCustomerByDoc(documentNumber: string, documentType: string): Promise<Customer | null>;
  findCustomerByCellphone(cellphone: string): Promise<Customer | null>;
  findCustomerByEmail(email: string): Promise<Customer | null>;
  
  createSkeletonCustomer(data: {
    cellphone: string;
    documentNumber: string;
    documentType: string;
    email: string;
    documentExtension?: string;
    documentComplement?: string;
  }): Promise<Customer>;

  // OTP Sessions
  createOtpSession(cellphone: string, otp: string): Promise<OtpSession>;
  getOtpSession(cellphone: string): Promise<OtpSession | null>;
  verifyOtpSession(id: number): Promise<void>;

  // Face Recognition Sessions
  createFaceSession(cellphone: string, sessionId: string): Promise<FaceSession>;
  getFaceSession(sessionId: string): Promise<FaceSession | null>;
  deleteFaceSession(sessionId: string): Promise<void>;

  // Reference Code
  updateReferenceCode(id: number, code: string): Promise<void>;

  // Complete Registration & Cognito Integration
  completeCustomerRegistration(
    id: number,
    data: {
      cic: string;
      homeAddress: string;
      pinHash: string;
      cognitoSub: string;
      isMarried: boolean;
    }
  ): Promise<void>;

  // Cognito / Sign In operations
  authenticate(cellphone: string, pin: string): Promise<{
    privateToken: string;
    customer: Customer;
  }>;
}
