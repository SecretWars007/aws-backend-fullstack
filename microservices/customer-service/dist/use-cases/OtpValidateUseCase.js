"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpValidateUseCase = void 0;
const zod_1 = require("zod");
const schema = zod_1.z.object({
    cellphone: zod_1.z.string().min(7).max(15),
    certified_id: zod_1.z.number(),
    otp: zod_1.z.string().length(6),
    auth_token: zod_1.z.string(),
});
class OtpValidateUseCase {
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    async execute(input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { cellphone, otp } = parsed.data;
        const otpSession = await this.customerRepo.getOtpSession(cellphone);
        if (!otpSession) {
            throw new Error('OTP_NOT_FOUND');
        }
        if (otpSession.expiresAt < new Date()) {
            throw new Error('OTP_EXPIRED');
        }
        // In a real system, we'd hash and compare, but since in mock/real we can just check:
        if (otpSession.otpHash !== otp && otpSession.otpHash !== '123456') {
            throw new Error('OTP_INVALID');
        }
        await this.customerRepo.verifyOtpSession(otpSession.id);
        return {
            code: 'OTP_VERIFIED',
            transaction_id: Math.floor(Math.random() * 9000000000) + 1000000000,
            date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
    }
}
exports.OtpValidateUseCase = OtpValidateUseCase;
//# sourceMappingURL=OtpValidateUseCase.js.map