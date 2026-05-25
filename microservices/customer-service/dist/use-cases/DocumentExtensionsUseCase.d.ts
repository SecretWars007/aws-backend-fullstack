import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
import { Extension } from '../domain/entities/Customer';
export declare class DocumentExtensionsUseCase {
    private readonly customerRepo;
    constructor(customerRepo: ICustomerRepository);
    execute(): Promise<{
        extensions: Extension[];
    }>;
}
