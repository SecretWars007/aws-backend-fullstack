import { IWalletRepository } from '../domain/repositories/IWalletRepository';
import { WalletCard } from '../domain/entities/Wallet';
export declare class BalancesUseCase {
    private readonly walletRepo;
    constructor(walletRepo: IWalletRepository);
    execute(customerId: number): Promise<{
        wallet_cards: WalletCard[];
        actions: any[];
    }>;
}
