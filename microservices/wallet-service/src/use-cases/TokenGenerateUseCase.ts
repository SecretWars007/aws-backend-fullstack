import { IWalletRepository } from '../domain/repositories/IWalletRepository';
import { z } from 'zod';

const schema = z.object({
  cellphone: z.string().min(7).max(15),
  amount: z.number().positive(),
});

export class TokenGenerateUseCase {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async execute(customerId: number, input: { cellphone: string; amount: number }): Promise<{
    token: string;
    message: string;
  }> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new Error(`Validation error: ${parsed.error.message}`);
    }

    const { cellphone, amount } = parsed.data;

    // Generate a random 6-digit transaction token
    const token = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in repo (DB or Redis)
    await this.walletRepo.createTransferSession(customerId, cellphone, amount, token);

    // Return the token (in real mode, this would be sent via SMS, but we return it in API or log it)
    console.log(`[Transfer Authorization Code] Generated token ${token} for Customer ${customerId} to transfer ${amount} to ${cellphone}`);

    return {
      token, // Return token directly for ease of use/integration testing
      message: 'Token de transferencia generado y enviado',
    };
  }
}
