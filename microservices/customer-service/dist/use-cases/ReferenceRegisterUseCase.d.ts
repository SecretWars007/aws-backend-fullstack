import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
export interface ReferenceRegisterInput {
    id: number;
    code: string;
    cellphone?: string;
    auth_token: string;
}
export declare class ReferenceRegisterUseCase {
    private readonly customerRepo;
    constructor(customerRepo: ICustomerRepository);
    execute(input: ReferenceRegisterInput): Promise<{
        code: string;
        transaction_id: number;
        date: string;
    }>;
}
