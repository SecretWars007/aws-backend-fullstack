import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok, badRequest, serverError, parseBody } from '../utils/response';
import { query } from '../layers/database/db';
import { ValidateUserInput, ValidateUserData } from '../types';

/**
 * POST /V1/register/validate/user
 * Validates identity data and returns the user record (or creates a skeleton).
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseBody<ValidateUserInput>(event);

    if (!body.document_number || !body.document_type || !body.cellphone || !body.email) {
      return badRequest('cellphone, document_number, document_type and email are required');
    }

    // Check if the user already exists by document number
    const existing = await query<ValidateUserData & { id: number }>(
      `SELECT id, cic, home_address, is_client, is_married
       FROM users
       WHERE document_number = $1 AND document_type = $2
       LIMIT 1`,
      [body.document_number, body.document_type],
    );

    if (existing.length > 0) {
      const u = existing[0];
      return ok<ValidateUserData>({
        id: u.id,
        cic: u.cic,
        home_address: u.home_address,
        is_client: u.is_client,
        is_married: u.is_married,
      });
    }

    // Pre-register skeleton user (no Cognito account yet)
    const inserted = await query<{ id: number }>(
      `INSERT INTO users
         (cellphone, email, document_number, document_type,
          document_extension, document_complement, is_client, is_married)
       VALUES ($1, $2, $3, $4, $5, $6, false, false)
       ON CONFLICT (cellphone) DO UPDATE
         SET email = EXCLUDED.email, updated_at = NOW()
       RETURNING id`,
      [
        body.cellphone,
        body.email,
        body.document_number,
        body.document_type,
        body.document_extension ?? null,
        body.document_complement ?? null,
      ],
    );

    const userId = inserted[0].id;

    return ok<ValidateUserData>({
      id: userId,
      cic: '',
      home_address: '',
      is_client: false,
      is_married: false,
    });
  } catch (err) {
    console.error('[validateUser]', err);
    return serverError('Internal server error');
  }
};
