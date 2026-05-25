import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const schema = z.object({
  cellphone: z.string().min(7).max(15),
  certified_id: z.number(),
  document_number: z.string().min(5).max(20),
  document_type: z.string().min(2).max(10),
  document_extension: z.string().optional(),
  document_complement: z.string().optional(),
  auth_token: z.string(),
});

export interface FaceRecognitionInitInput {
  cellphone: string;
  certified_id: number;
  document_number: string;
  document_type: string;
  document_extension?: string;
  document_complement?: string;
  auth_token: string;
}

export class FaceRecognitionInitUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(input: FaceRecognitionInitInput): Promise<{
    instruction: string;
    image: string;
    session_id: string;
  }> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new Error(`Validation error: ${parsed.error.message}`);
    }

    const { cellphone } = parsed.data;

    // Generate unique session id
    const session_id = `FR-SESSION-${Date.now()}-${uuidv4().split('-')[0]}`;
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
