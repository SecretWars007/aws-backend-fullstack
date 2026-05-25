import { IWalletRepository } from '../domain/repositories/IWalletRepository';
import { WalletMovement } from '../domain/entities/Wallet';

export class MovementsUseCase {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async execute(customerId: number): Promise<WalletMovement[]> {
    return this.walletRepo.getMovements(customerId);
  }
}
