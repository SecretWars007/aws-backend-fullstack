import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
import { Customer } from '../domain/entities/Customer';
import { z } from 'zod';

const schema = z.object({
  cellphone: z.string().min(7).max(15),
  document_number: z.string().min(5).max(20),
  document_type: z.string().min(2).max(10),
  email: z.string().email(),
  document_extension: z.string().optional(),
  document_complement: z.string().optional(),
  certified_id: z.number(),
  auth_token: z.string(),
});

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

export class UsersValidateUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(input: UsersValidateInput): Promise<{
    id: number;
    cic: string;
    home_address: string;
    is_client: boolean;
    is_married: boolean;
  }> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new Error(`Validation error: ${parsed.error.message}`);
    }

    const { cellphone, document_number, document_type, email, document_extension, document_complement } = parsed.data;

    // Check if customer already exists by document or phone
    let customer = await this.customerRepo.findCustomerByDoc(document_number, document_type);
    if (!customer) {
      customer = await this.customerRepo.findCustomerByCellphone(cellphone);
    }

    if (!customer) {
      // Create skeleton customer
      customer = await this.customerRepo.createSkeletonCustomer({
        cellphone,
        documentNumber: document_number,
        documentType: document_type,
        email,
        documentExtension: document_extension,
        documentComplement: document_complement,
      });
    }

    // In mock mode or initial state, send a mock SMS OTP code
    await this.customerRepo.createOtpSession(cellphone, '123456');

    return {
      id: customer.id,
      cic: customer.cic ?? '',
      home_address: customer.homeAddress ?? '',
      is_client: customer.isClient,
      is_married: customer.isMarried,
    };
  }
}
