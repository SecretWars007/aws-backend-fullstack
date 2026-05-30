"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RechargeParamsUseCase = void 0;
class RechargeParamsUseCase {
    constructor(walletRepo) {
        this.walletRepo = walletRepo;
    }
    async execute() {
        const providers = await this.walletRepo.getRechargeProviders();
        return { providers };
    }
}
exports.RechargeParamsUseCase = RechargeParamsUseCase;
//# sourceMappingURL=RechargeParamsUseCase.js.map