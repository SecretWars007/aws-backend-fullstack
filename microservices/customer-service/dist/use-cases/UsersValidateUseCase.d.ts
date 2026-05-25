import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
export interface UsersValidateInput {
    cellphone: string;
    document_number: string;
    document_type: string;
    email: string;
    document_extension?: string;
    document_complement?: string;
    certified_id: number;
    auth_token: string;
}
export declare class UsersValidateUseCase {
    private readonly customerRepo;
    constructor(customerRepo: ICustomerRepository);
    execute(input: UsersValidateInput): Promise<{
        id: number;
        cic: string;
        home_address: string;
        is_client: boolean;
        is_married: boolean;
    }>;
}
