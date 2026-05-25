"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalancesUseCase = void 0;
class BalancesUseCase {
    constructor(walletRepo) {
        this.walletRepo = walletRepo;
    }
    async execute(customerId) {
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
exports.BalancesUseCase = BalancesUseCase;
