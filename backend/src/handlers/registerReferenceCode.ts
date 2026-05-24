import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok, badRequest, serverError, parseBody, generateTransactionResponse } from '../utils/response';
import { query } from '../layers/database/db';
import { RegisterReferenceCodeInput } from '../types';

/**
 * POST /V1/client/reference/register/code
 * Registers a referral code for the user.
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseBody<RegisterReferenceCodeInput>(event);

    if (!body.code || !body.id) {
      return badRequest('code and id are required');
    }

    await query(
      `INSERT INTO reference_codes (user_id, code) VALUES ($1, $2)`,
      [body.id, body.code],
    );

    return ok(generateTransactionResponse('REFERENCE_APPLIED'));
  } catch (err) {
    console.error('[registerReferenceCode]', err);
    return serverError('Internal server error');
  }
};
