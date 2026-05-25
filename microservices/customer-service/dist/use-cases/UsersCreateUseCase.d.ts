import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
export interface UsersCreateInput {
    id: number;
    cellphone: string;
    certified_id: number;
    cic: string;
    device_type: string;
    document_number: string;
    document_type: string;
    document_extension?: string;
    document_complement?: string;
    email: string;
    home_address: string;
    is_citizen_eeuu?: boolean;
    is_client?: boolean;
    is_married?: boolean;
    otp: string;
    pin: string;
    auth_token: string;
}
export declare class UsersCreateUseCase {
    private readonly customerRepo;
    private readonly walletServiceUrl;
    constructor(customerRepo: ICustomerRepository, walletServiceUrl: string);
    execute(input: UsersCreateInput): Promise<{
        code: string;
        transaction_id: number;
        date: string;
    }>;
}
