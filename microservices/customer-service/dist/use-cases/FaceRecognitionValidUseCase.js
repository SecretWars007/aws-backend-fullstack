"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaceRecognitionValidUseCase = void 0;
const zod_1 = require("zod");
const schema = zod_1.z.object({
    session_id: zod_1.z.string().min(1),
    selfie: zod_1.z.string().min(1), // Base64 selfie
    certified_id: zod_1.z.number(),
    auth_token: zod_1.z.string(),
});
class FaceRecognitionValidUseCase {
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    async execute(input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { session_id } = parsed.data;
        const session = await this.customerRepo.getFaceSession(session_id);
        if (!session) {
            throw new Error('FACE_SESSION_NOT_FOUND');
        }
        if (session.expiresAt < new Date()) {
            throw new Error('FACE_SESSION_EXPIRED');
        }
        // In mock mode, we assume the selfie verification is successful.
        // In real mode (production), this would call AWS Rekognition to compare the selfie
        // with the ID document photo.
        await this.customerRepo.deleteFaceSession(session_id);
        return {
            code: 'FACE_VERIFIED',
            transaction_id: Math.floor(Math.random() * 9000000000) + 1000000000,
            date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
    }
}
exports.FaceRecognitionValidUseCase = FaceRecognitionValidUseCase;
//# sourceMappingURL=FaceRecognitionValidUseCase.js.map