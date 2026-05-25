import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
import { z } from 'zod';

const schema = z.object({
  id: z.number(),
  code: z.string().min(1).max(50),
  cellphone: z.string().optional(),
  auth_token: z.string(),
});

export interface ReferenceRegisterInput {
  id: number;
  code: string;
  cellphone?: string;
  auth_token: string;
}

export class ReferenceRegisterUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(input: ReferenceRegisterInput): Promise<{
    code: string;
    transaction_id: number;
    date: string;
  }> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new Error(`Validation error: ${parsed.error.message}`);
    }

    const { id, code } = parsed.data;

    // Check if the user exists
    const customer = await this.customerRepo.findCustomerById(id);
    if (!customer) {
      throw new Error('CUSTOMER_NOT_FOUND');
    }

    await this.customerRepo.updateReferenceCode(id, code);

    return {
      code: 'REFERENCE_APPLIED',
      transaction_id: Math.floor(Math.random() * 9000000000) + 1000000000,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
  }
}
