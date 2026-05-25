"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignInUseCase = void 0;
const zod_1 = require("zod");
const schema = zod_1.z.object({
    mobile_number: zod_1.z.string().min(7).max(15),
    pin: zod_1.z.string().min(6),
    application: zod_1.z.string().optional(),
    certified_id: zod_1.z.number(),
    device_id: zod_1.z.string().optional(),
    device_name: zod_1.z.string().optional(),
    device_os: zod_1.z.string().optional(),
    is_root: zod_1.z.boolean().optional().default(false),
    notification_id: zod_1.z.string().optional(),
    version: zod_1.z.string().optional(),
    auth_token: zod_1.z.string(),
});
class SignInUseCase {
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    async execute(input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { mobile_number, pin } = parsed.data;
        // Use repository to authenticate (either Cognito or local DB depending on MOCK_MODE)
        const { privateToken, customer } = await this.customerRepo.authenticate(mobile_number, pin);
        return {
            private_token: privateToken,
            mobile_number: customer.cellphone,
            time_session: 3600,
            name: customer.name ?? 'GUSTAVO',
            last_name: customer.lastName ?? 'PARKER',
            second_last_name: customer.secondLastName ?? '',
            document_number: customer.documentNumber,
            document_extension: customer.documentExtension ?? 'SC',
            document_type: customer.documentType,
            email: customer.email,
            city: customer.city ?? 'Santa Cruz',
            id: customer.id,
            register_completed: customer.registerCompleted,
            is_client: customer.isClient,
            number_show_form: 0,
            business: '',
            RegisterShowForm: false,
        };
    }
}
exports.SignInUseCase = SignInUseCase;
//# sourceMappingURL=SignInUseCase.js.map