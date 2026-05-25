import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
export interface FaceRecognitionInitInput {
    cellphone: string;
    certified_id: number;
    document_number: string;
    document_type: string;
    document_extension?: string;
    document_complement?: string;
    auth_token: string;
}
export declare class FaceRecognitionInitUseCase {
    private readonly customerRepo;
    constructor(customerRepo: ICustomerRepository);
    execute(input: FaceRecognitionInitInput): Promise<{
        instruction: string;
        image: string;
        session_id: string;
    }>;
}
