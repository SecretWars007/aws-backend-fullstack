"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferValidateUseCase = void 0;
const zod_1 = require("zod");
const schema = zod_1.z.object({
    cellphone: zod_1.z.string().min(7).max(15),
});
class TransferValidateUseCase {
    constructor(walletRepo) {
        this.walletRepo = walletRepo;
    }
    async execute(input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { cellphone } = parsed.data;
        const result = await this.walletRepo.validateTargetCellphone(cellphone);
        if (!result) {
            throw new Error('RECIPIENT_NOT_FOUND');
        }
        return {
            name: result.name,
            message: 'Destinatario válido',
        };
    }
}
exports.TransferValidateUseCase = TransferValidateUseCase;
//# sourceMappingURL=TransferValidateUseCase.js.map