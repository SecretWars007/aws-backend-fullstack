"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovementsUseCase = void 0;
class MovementsUseCase {
    constructor(walletRepo) {
        this.walletRepo = walletRepo;
    }
    async execute(customerId) {
        return this.walletRepo.getMovements(customerId);
    }
}
exports.MovementsUseCase = MovementsUseCase;
