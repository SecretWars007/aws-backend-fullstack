import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
export declare class ParametersUseCase {
    private readonly customerRepo;
    constructor(customerRepo: ICustomerRepository);
    execute(customerId: number): Promise<{
        greeting: string;
        show_dialog: boolean;
    }>;
}
