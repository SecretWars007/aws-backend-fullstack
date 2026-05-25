"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferExecuteUseCase = void 0;
const zod_1 = require("zod");
const schema = zod_1.z.object({
    cellphone: zod_1.z.string().min(7).max(15),
    amount: zod_1.z.number().positive(),
    token: zod_1.z.string().length(6),
});
class TransferExecuteUseCase {
    constructor(walletRepo) {
        this.walletRepo = walletRepo;
    }
    async execute(customerId, input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { cellphone, amount, token } = parsed.data;
        // Verify token session exists
        const session = await this.walletRepo.getTransferSession(customerId, token);
        if (!session) {
            throw new Error('INVALID_OR_EXPIRED_TOKEN');
        }
        if (session.expiresAt < new Date()) {
            throw new Error('TOKEN_EXPIRED');
        }
        // Tamper-proof validation (OWASP A01)
        if (session.cellphone !== cellphone || session.amount !== amount) {
            throw new Error('TRANSACTION_DETAILS_MISMATCH');
        }
        // Execute transfer transactionally in database
        const movement = await this.walletRepo.executeTransfer(customerId, cellphone, amount);
        // Delete session to prevent reuse
        await this.walletRepo.deleteTransferSession(session.id);
        return {
            code: 'TRANSFER_SUCCESSFUL',
            transaction_id: movement.id,
            date: movement.date,
            balance: amount,
        };
    }
}
exports.TransferExecuteUseCase = TransferExecuteUseCase;
