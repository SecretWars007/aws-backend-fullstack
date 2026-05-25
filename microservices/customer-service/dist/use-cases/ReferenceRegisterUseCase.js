"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceRegisterUseCase = void 0;
const zod_1 = require("zod");
const schema = zod_1.z.object({
    id: zod_1.z.number(),
    code: zod_1.z.string().min(1).max(50),
    cellphone: zod_1.z.string().optional(),
    auth_token: zod_1.z.string(),
});
class ReferenceRegisterUseCase {
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    async execute(input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { id, code } = parsed.data;
        // Check if the user exists
        const customer = await this.customerRepo.findCustomerById(id);
        if (!customer) {
            throw new Error('CUSTOMER_NOT_FOUND');
        }
        await this.customerRepo.updateReferenceCode(id, code);
        return {
            code: 'REFERENCE_APPLIED',
            transaction_id: Math.floor(Math.random() * 9000000000) + 1000000000,
            date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
    }
}
exports.ReferenceRegisterUseCase = ReferenceRegisterUseCase;
//# sourceMappingURL=ReferenceRegisterUseCase.js.map