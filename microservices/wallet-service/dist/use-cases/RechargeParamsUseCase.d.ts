import { IWalletRepository } from '../domain/repositories/IWalletRepository';
import { RechargeProvider } from '../domain/entities/Wallet';
export declare class RechargeParamsUseCase {
    private readonly walletRepo;
    constructor(walletRepo: IWalletRepository);
    execute(): Promise<{
        providers: RechargeProvider[];
    }>;
}
