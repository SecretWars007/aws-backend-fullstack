import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
import { z } from 'zod';
import { Customer } from '../domain/entities/Customer';

const schema = z.object({
  mobile_number: z.string().min(7).max(15),
  pin: z.string().min(6),
  application: z.string().optional(),
  certified_id: z.number(),
  device_id: z.string().optional(),
  device_name: z.string().optional(),
  device_os: z.string().optional(),
  is_root: z.boolean().optional().default(false),
  notification_id: z.string().optional(),
  version: z.string().optional(),
  auth_token: z.string(),
});

export interface SignInInput {
  mobile_number: string;
  pin: string;
  application?: string;
  certified_id: number;
  device_id?: string;
  device_name?: string;
  device_os?: string;
  is_root?: boolean;
  notification_id?: string;
  version?: string;
  auth_token: string;
}

export interface SignInOutput {
  private_token: string;
  mobile_number: string;
  time_session: number;
  name: string;
  last_name: string;
  second_last_name: string;
  document_number: string;
  document_extension: string;
  document_type: string;
  email: string;
  city: string;
  id: number;
  register_completed: boolean;
  is_client: boolean;
  number_show_form: number;
  business: string;
  RegisterShowForm: boolean;
}

export class SignInUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(input: SignInInput): Promise<SignInOutput> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new Error(`Validation error: ${parsed.error.message}`);
    }

    const { mobile_number, pin } = parsed.data;

    // Use repository to authenticate (either Cognito or local DB depending on MOCK_MODE)
    const { privateToken, customer } = await this.customerRepo.authenticate(mobile_number, pin);

    return {
      private_token: privateToken,
      mobile_number: customer.cellphone,
      time_session: 3600,
      name: customer.name ?? 'GUSTAVO',
      last_name: customer.lastName ?? 'PARKER',
      second_last_name: customer.secondLastName ?? '',
      document_number: customer.documentNumber,
      document_extension: customer.documentExtension ?? 'SC',
      document_type: customer.documentType,
      email: customer.email,
      city: customer.city ?? 'Santa Cruz',
      id: customer.id,
      register_completed: customer.registerCompleted,
      is_client: customer.isClient,
      number_show_form: 0,
      business: '',
      RegisterShowForm: false,
    };
  }
}
