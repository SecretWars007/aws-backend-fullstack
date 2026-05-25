"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RechargeTigoUseCase = void 0;
const zod_1 = require("zod");
const schema = zod_1.z.object({
    cellphone: zod_1.z.string().min(7).max(15),
    amount: zod_1.z.number().positive(),
});
class RechargeTigoUseCase {
    constructor(walletRepo) {
        this.walletRepo = walletRepo;
    }
    async execute(customerId, input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { cellphone, amount } = parsed.data;
        const movement = await this.walletRepo.recharge(customerId, 12, cellphone, amount);
        return {
            code: 'RECHARGE_SUCCESSFUL',
            transaction_id: movement.id,
            date: movement.date,
            balance: amount,
        };
    }
}
exports.RechargeTigoUseCase = RechargeTigoUseCase;
