"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaceRecognitionInitUseCase = void 0;
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const schema = zod_1.z.object({
    cellphone: zod_1.z.string().min(7).max(15),
    certified_id: zod_1.z.number(),
    document_number: zod_1.z.string().min(5).max(20),
    document_type: zod_1.z.string().min(2).max(10),
    document_extension: zod_1.z.string().optional(),
    document_complement: zod_1.z.string().optional(),
    auth_token: zod_1.z.string(),
});
class FaceRecognitionInitUseCase {
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    async execute(input) {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error.message}`);
        }
        const { cellphone } = parsed.data;
        // Generate unique session id
        const session_id = `FR-SESSION-${Date.now()}-${(0, uuid_1.v4)().split('-')[0]}`;
        await this.customerRepo.createFaceSession(cellphone, session_id);
        // Hardcoded base64 mockup image representing face instructions/placeholder
        const base64Image = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2gBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Af//Z';
        return {
            instruction: 'Por favor mire directamente a la cámara y mantenga su rostro dentro del marco',
            image: base64Image,
            session_id,
        };
    }
}
exports.FaceRecognitionInitUseCase = FaceRecognitionInitUseCase;
//# sourceMappingURL=FaceRecognitionInitUseCase.js.map