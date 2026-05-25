import { IWalletRepository } from '../domain/repositories/IWalletRepository';
import { WalletCard, WalletMovement } from '../domain/entities/Wallet';

export class BalancesUseCase {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async execute(customerId: number): Promise<{
    wallet_cards: WalletCard[];
    actions: any[];
  }> {
    const cards = await this.walletRepo.getWalletCards(customerId);
    const movements = await this.walletRepo.getMovements(customerId);

    // Format movements into PDF actions structure
    const actions = movements.map(m => ({
      date: m.date,
      amount: m.amount,
      currency: m.currency,
      type: m.type,
      description: m.description,
      detail: m.detail,
      destination_account: m.destinationAccount,
      destination_account_name: m.destinationAccountName,
    }));

    return {
      wallet_cards: cards,
      actions,
    };
  }
}
