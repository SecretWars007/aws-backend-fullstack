import { IWalletRepository } from '../domain/repositories/IWalletRepository';
export declare class TransferValidateUseCase {
    private readonly walletRepo;
    constructor(walletRepo: IWalletRepository);
    execute(input: {
        cellphone: string;
    }): Promise<{
        name: string;
        message: string;
    }>;
}
