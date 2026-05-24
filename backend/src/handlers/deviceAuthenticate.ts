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
import { DeviceAuthenticateInput } from '../types';

/**
 * POST /V1/device/authenticate
 * Authenticates a known device and refreshes its auth token.
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseBody<DeviceAuthenticateInput>(event);

    if (!body.device_id || !body.device_type) {
      return badRequest('device_id and device_type are required');
    }

    // Look up existing device
    const rows = await query<{ id: number }>(
      `SELECT id FROM devices WHERE device_id = $1`,
      [body.device_id],
    );

    let certifiedId: number;

    if (rows.length === 0) {
      // Auto-register on first authenticate call
      const ins = await query<{ id: number }>(
        `INSERT INTO devices (device_id, device_type, encrypted_device)
         VALUES ($1, $2, $3) RETURNING id`,
        [body.device_id, body.device_type, body.encrypted_device ?? null],
      );
      certifiedId = ins[0].id;
    } else {
      certifiedId = rows[0].id;
      // Update encrypted_device if provided
      if (body.encrypted_device) {
        await query(
          `UPDATE devices SET encrypted_device = $1, updated_at = NOW() WHERE device_id = $2`,
          [body.encrypted_device, body.device_id],
        );
      }
    }

    const { key, iv } = generateDeviceCrypto();
    const auth_token = signDeviceToken({ deviceId: body.device_id, certifiedId });

    return ok({ key, iv, certified_id: certifiedId, auth_token });
  } catch (err) {
    console.error('[deviceAuthenticate]', err);
    return serverError('Internal server error');
  }
};
