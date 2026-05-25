"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersValidateUseCase = void 0;
const zod_1 = require("zod");
const schema = zod_1.z.object({
    cellphone: zod_1.z.string().min(7).max(15),
    document_number: zod_1.z.string().min(5).max(20),
    document_type: zod_1.z.string().min(2).max(10),
    email: zod_1.z.string().email(),
    document_extension: zod_1.z.string().optional(),
    document_complement: zod_1.z.string().optional(),
    certified_id: zod_1.z.number(),
    auth_token: zod_1.z.string(),
});
class UsersValidateUseCase {
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    async execute(input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { cellphone, document_number, document_type, email, document_extension, document_complement } = parsed.data;
        // Check if customer already exists by document or phone
        let customer = await this.customerRepo.findCustomerByDoc(document_number, document_type);
        if (!customer) {
            customer = await this.customerRepo.findCustomerByCellphone(cellphone);
        }
        if (!customer) {
            // Create skeleton customer
            customer = await this.customerRepo.createSkeletonCustomer({
                cellphone,
                documentNumber: document_number,
                documentType: document_type,
                email,
                documentExtension: document_extension,
                documentComplement: document_complement,
            });
        }
        // In mock mode or initial state, send a mock SMS OTP code
        await this.customerRepo.createOtpSession(cellphone, '123456');
        return {
            id: customer.id,
            cic: customer.cic ?? '',
            home_address: customer.homeAddress ?? '',
            is_client: customer.isClient,
            is_married: customer.isMarried,
        };
    }
}
exports.UsersValidateUseCase = UsersValidateUseCase;
//# sourceMappingURL=UsersValidateUseCase.js.map