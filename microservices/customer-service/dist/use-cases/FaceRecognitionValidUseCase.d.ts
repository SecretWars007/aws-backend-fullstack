import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
export interface FaceRecognitionValidInput {
    session_id: string;
    selfie: string;
    certified_id: number;
    auth_token: string;
}
export declare class FaceRecognitionValidUseCase {
    private readonly customerRepo;
    constructor(customerRepo: ICustomerRepository);
    execute(input: FaceRecognitionValidInput): Promise<{
        code: string;
        transaction_id: number;
        date: string;
    }>;
}
