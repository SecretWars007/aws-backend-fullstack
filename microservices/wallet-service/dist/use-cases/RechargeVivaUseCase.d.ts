import { IWalletRepository } from '../domain/repositories/IWalletRepository';
export declare class RechargeVivaUseCase {
    private readonly walletRepo;
    constructor(walletRepo: IWalletRepository);
    execute(customerId: number, input: {
        cellphone: string;
        amount: number;
    }): Promise<{
        code: string;
        transaction_id: number;
        date: string;
        balance: number;
    }>;
}
