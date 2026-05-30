import { IWalletRepository } from '../domain/repositories/IWalletRepository';
import { WalletMovement } from '../domain/entities/Wallet';
export declare class MovementsUseCase {
    private readonly walletRepo;
    constructor(walletRepo: IWalletRepository);
    execute(customerId: number): Promise<WalletMovement[]>;
}
