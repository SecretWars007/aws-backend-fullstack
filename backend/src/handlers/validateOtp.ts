import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok, badRequest, serverError, parseBody, generateTransactionResponse } from '../utils/response';
import { query } from '../layers/database/db';
import { ValidateOtpInput } from '../types';
import { createHash } from 'crypto';

/**
 * POST /V1/register/validate/otp
 * Validates the OTP sent to the user's cellphone.
 * In a real system the OTP is sent by SMS via SNS; here we validate against the DB.
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseBody<ValidateOtpInput>(event);

    if (!body.cellphone || !body.otp || !body.certified_id) {
      return badRequest('cellphone, otp and certified_id are required');
    }

    // Look up the most recent non-expired, non-verified OTP for this cellphone
    const rows = await query<{ id: number; otp_hash: string }>(
      `SELECT id, otp_hash
       FROM otp_sessions
       WHERE cellphone = $1
         AND certified_id = $2
         AND verified = false
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [body.cellphone, body.certified_id],
    );

    if (rows.length === 0) {
      return badRequest('OTP not found or expired. Please request a new one.');
    }

    const storedHash = rows[0].otp_hash;
    const incomingHash = createHash('sha256').update(body.otp).digest('hex');

    if (storedHash !== incomingHash) {
      return badRequest('Invalid OTP code');
    }

    // Mark as verified
    await query(
      `UPDATE otp_sessions SET verified = true WHERE id = $1`,
      [rows[0].id],
    );

    return ok(generateTransactionResponse('OTP_VERIFIED'));
  } catch (err) {
    console.error('[validateOtp]', err);
    return serverError('Internal server error');
  }
};
