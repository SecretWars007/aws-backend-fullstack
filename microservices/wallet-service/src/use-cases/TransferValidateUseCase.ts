import { IWalletRepository } from '../domain/repositories/IWalletRepository';
import { z } from 'zod';

const schema = z.object({
  cellphone: z.string().min(7).max(15),
});

export class TransferValidateUseCase {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async execute(input: { cellphone: string }): Promise<{
    name: string;
    message: string;
  }> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new Error(`Validation error: ${parsed.error.message}`);
    }

    const { cellphone } = parsed.data;
    const result = await this.walletRepo.validateTargetCellphone(cellphone);

    if (!result) {
      throw new Error('RECIPIENT_NOT_FOUND');
    }

    return {
      name: result.name,
      message: 'Destinatario válido',
    };
  }
}
