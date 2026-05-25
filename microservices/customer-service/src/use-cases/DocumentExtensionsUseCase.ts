import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
import { Extension } from '../domain/entities/Customer';

export class DocumentExtensionsUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(): Promise<{ extensions: Extension[] }> {
    const extensions = await this.customerRepo.getExtensions();
    return { extensions };
  }
}
