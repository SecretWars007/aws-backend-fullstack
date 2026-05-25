import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
import { z } from 'zod';

const schema = z.object({
  session_id: z.string().min(1),
  selfie: z.string().min(1), // Base64 selfie
  certified_id: z.number(),
  auth_token: z.string(),
});

export interface FaceRecognitionValidInput {
  session_id: string;
  selfie: string;
  certified_id: number;
  auth_token: string;
}

export class FaceRecognitionValidUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(input: FaceRecognitionValidInput): Promise<{
    code: string;
    transaction_id: number;
    date: string;
  }> {
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
