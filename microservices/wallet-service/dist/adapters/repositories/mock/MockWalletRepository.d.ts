import { IWalletRepository } from '../../../domain/repositories/IWalletRepository';
import { WalletCard, WalletMovement, RechargeProvider, TransferSession } from '../../../domain/entities/Wallet';
export declare class MockWalletRepository implements IWalletRepository {
    private readonly cards;
    private readonly movements;
    private readonly transferSessions;
    private nextMovementId;
    constructor();
    private getOrCreateCards;
    createWalletCard(customerId: number, cellphone: string): Promise<WalletCard>;
    getWalletCards(customerId: number): Promise<WalletCard[]>;
    getMovements(customerId: number): Promise<WalletMovement[]>;
    getRechargeProviders(): Promise<RechargeProvider[]>;
    recharge(customerId: number, providerCode: number, cellphone: string, amount: number): Promise<WalletMovement>;
    createTransferSession(customerId: number, cellphone: string, amount: number, token: string): Promise<TransferSession>;
    getTransferSession(customerId: number, token: string): Promise<TransferSession | null>;
    deleteTransferSession(id: number): Promise<void>;
    validateTargetCellphone(cellphone: string): Promise<{
        name: string;
        id: number;
    } | null>;
    executeTransfer(fromCustomerId: number, toCellphone: string, amount: number): Promise<WalletMovement>;
}
