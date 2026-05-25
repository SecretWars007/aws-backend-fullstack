"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenGenerateUseCase = void 0;
const zod_1 = require("zod");
const schema = zod_1.z.object({
    cellphone: zod_1.z.string().min(7).max(15),
    amount: zod_1.z.number().positive(),
});
class TokenGenerateUseCase {
    constructor(walletRepo) {
        this.walletRepo = walletRepo;
    }
    async execute(customerId, input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { cellphone, amount } = parsed.data;
        // Generate a random 6-digit transaction token
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        // Store in repo (DB or Redis)
        await this.walletRepo.createTransferSession(customerId, cellphone, amount, token);
        // Return the token (in real mode, this would be sent via SMS, but we return it in API or log it)
        console.log(`[Transfer Authorization Code] Generated token ${token} for Customer ${customerId} to transfer ${amount} to ${cellphone}`);
        return {
            token, // Return token directly for ease of use/integration testing
            message: 'Token de transferencia generado y enviado',
        };
    }
}
exports.TokenGenerateUseCase = TokenGenerateUseCase;
