import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
export interface OtpValidateInput {
    cellphone: string;
    certified_id: number;
    otp: string;
    auth_token: string;
}
export declare class OtpValidateUseCase {
    private readonly customerRepo;
    constructor(customerRepo: ICustomerRepository);
    execute(input: OtpValidateInput): Promise<{
        code: string;
        transaction_id: number;
        date: string;
    }>;
}
