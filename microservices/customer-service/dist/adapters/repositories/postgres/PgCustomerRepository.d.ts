import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import { Customer, Extension, OtpSession, FaceSession } from '../../../domain/entities/Customer';
export declare class PgCustomerRepository implements ICustomerRepository {
    private readonly cognitoClient;
    constructor();
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
    createOtpSession(cellphone: string, otp: string): Promise<OtpSession>;
    getOtpSession(cellphone: string): Promise<OtpSession | null>;
    verifyOtpSession(id: number): Promise<void>;
    createFaceSession(cellphone: string, sessionId: string): Promise<FaceSession>;
    getFaceSession(sessionId: string): Promise<FaceSession | null>;
    deleteFaceSession(sessionId: string): Promise<void>;
    updateReferenceCode(id: number, code: string): Promise<void>;
    completeCustomerRegistration(id: number, data: {
        cic: string;
        homeAddress: string;
        pinHash: string;
        cognitoSub: string;
        isMarried: boolean;
    }): Promise<void>;
    authenticate(cellphone: string, pin: string): Promise<{
        privateToken: string;
        customer: Customer;
    }>;
}
