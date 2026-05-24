import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  ok,
  badRequest,
  serverError,
  parseBody,
  generateDeviceCrypto,
  signDeviceToken,
} from '../utils/response';
import { query } from '../layers/database/db';
import { DeviceIdentificationInput } from '../types';

/**
 * POST /V1/device/identification
 * Registers or updates a device and returns encryption keys + auth_token.
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseBody<DeviceIdentificationInput>(event);

    if (!body.device_id || !body.device_type) {
      return badRequest('device_id and device_type are required');
    }

    const { key, iv } = generateDeviceCrypto();

    // Upsert device record
    const rows = await query<{ id: number }>(
      `INSERT INTO devices (device_id, device_type, encrypted_device)
       VALUES ($1, $2, $3)
       ON CONFLICT (device_id) DO UPDATE
         SET device_type = EXCLUDED.device_type,
             encrypted_device = EXCLUDED.encrypted_device,
             updated_at = NOW()
       RETURNING id`,
      [body.device_id, body.device_type, body.encrypted_device ?? null],
    );

    const certifiedId = rows[0]?.id ?? 1;

    const auth_token = signDeviceToken({
      deviceId: body.device_id,
      certifiedId,
    });

    return ok(
      { key, iv, certified_id: certifiedId, auth_token },
      'OK',
    );
  } catch (err) {
    console.error('[deviceIdentification]', err);
    return serverError('Internal server error');
  }
};
