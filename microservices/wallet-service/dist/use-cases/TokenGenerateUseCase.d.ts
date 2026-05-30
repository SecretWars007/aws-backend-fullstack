import { IWalletRepository } from '../domain/repositories/IWalletRepository';
export declare class TokenGenerateUseCase {
    private readonly walletRepo;
    constructor(walletRepo: IWalletRepository);
    execute(customerId: number, input: {
        cellphone: string;
        amount: number;
    }): Promise<{
        token: string;
        message: string;
    }>;
}
