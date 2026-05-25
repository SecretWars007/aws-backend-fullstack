import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';

export class ParametersUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(customerId: number): Promise<{
    greeting: string;
    show_dialog: boolean;
  }> {
    const customer = await this.customerRepo.findCustomerById(customerId);
    const name = customer?.name ?? 'Gus';
    
    return {
      greeting: `¡Hola ${name}!`,
      show_dialog: false,
    };
  }
}
