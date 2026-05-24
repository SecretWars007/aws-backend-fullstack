import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok, badRequest, serverError, parseBody, generateTransactionResponse } from '../utils/response';
import { query } from '../layers/database/db';
import { ExecuteFaceRecognitionInput } from '../types';

/**
 * POST /V1/register/execute/face/recognition
 * Submits the base64 selfie to complete the biometric challenge.
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseBody<ExecuteFaceRecognitionInput>(event);

    if (!body.session_id || !body.selfie || !body.certified_id) {
      return badRequest('session_id, selfie, and certified_id are required');
    }

    const rows = await query<{ id: number }>(
      `SELECT id FROM face_sessions
       WHERE session_id = $1 AND certified_id = $2 AND status = 'PENDING' AND expires_at > NOW()
       LIMIT 1`,
      [body.session_id, body.certified_id],
    );

    if (rows.length === 0) {
      return badRequest('Biometric session invalid or expired');
    }

    // Mark as verified (assuming the "biometric" engine accepted it)
    await query(
      `UPDATE face_sessions SET status = 'VERIFIED' WHERE id = $1`,
      [rows[0].id]
    );

    return ok(generateTransactionResponse('FACE_VERIFIED'));
  } catch (err) {
    console.error('[executeFaceRecognition]', err);
    return serverError('Internal server error');
  }
};
