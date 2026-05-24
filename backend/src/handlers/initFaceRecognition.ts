import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok, badRequest, serverError, parseBody, generateSessionId } from '../utils/response';
import { query } from '../layers/database/db';
import { FaceRecognitionInitInput, FaceRecognitionInitData } from '../types';

/**
 * POST /V1/register/init/face/recognition
 * Initializes a biometric session and returns the instructions and base64 challenge image.
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseBody<FaceRecognitionInitInput>(event);

    if (!body.cellphone || !body.certified_id) {
      return badRequest('cellphone and certified_id are required');
    }

    const sessionId = generateSessionId();

    // Store session
    await query(
      `INSERT INTO face_sessions (session_id, cellphone, certified_id, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')`,
      [sessionId, body.cellphone, body.certified_id],
    );

    // Provide a dummy base64 instruction image, as specified in the PDF
    const dummyImage = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTEhUSEhMVEBUVFRURFRUVEBUQFhAPFhYWGBUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsOSgtLisBCgoKDg0OGBAQGi0fHR0rKy0tLS0rLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKy0tLS0tLS0tLS0tLS0tLTctLf/AABEIAOEA4AMBIgACEQEDEQH/xAAcAAEAAQUBAQAAAAAAAAAAAAAABgEDBAUHCAL/xABLEAABAwICBgUIBQgJCQAAAAABAAIDBBEFIQYSMUFRYQcTcYGRIjJCUnKhscEUI4K";

    return ok<FaceRecognitionInitData>({
      instruction: "Por favor mire directamente a la cámara y mantenga su rostro dentro del marco",
      image: dummyImage,
      session_id: sessionId
    });
  } catch (err) {
    console.error('[initFaceRecognition]', err);
    return serverError('Internal server error');
  }
};
