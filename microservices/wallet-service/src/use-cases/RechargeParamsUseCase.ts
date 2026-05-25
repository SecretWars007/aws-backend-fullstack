import { IWalletRepository } from '../domain/repositories/IWalletRepository';
import { RechargeProvider } from '../domain/entities/Wallet';

export class RechargeParamsUseCase {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async execute(): Promise<{ providers: RechargeProvider[] }> {
    const providers = await this.walletRepo.getRechargeProviders();
    return { providers };
  }
}
