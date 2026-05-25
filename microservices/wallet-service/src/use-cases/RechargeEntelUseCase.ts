import { IWalletRepository } from '../domain/repositories/IWalletRepository';
import { z } from 'zod';

const schema = z.object({
  cellphone: z.string().min(7).max(15),
  amount: z.number().positive(),
});

export class RechargeEntelUseCase {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async execute(customerId: number, input: { cellphone: string; amount: number }) {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new Error(`Validation error: ${parsed.error.message}`);
    }

    const { cellphone, amount } = parsed.data;
    const movement = await this.walletRepo.recharge(customerId, 13, cellphone, amount);
    
    return {
      code: 'RECHARGE_SUCCESSFUL',
      transaction_id: movement.id,
      date: movement.date,
      balance: amount,
    };
  }
}
