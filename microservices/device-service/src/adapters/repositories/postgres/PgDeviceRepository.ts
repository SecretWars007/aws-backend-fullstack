// ─── PostgreSQL Device Repository ────────────────────────────────────────────
// Active when MOCK_MODE=false
// Connects to real Aurora Serverless v2 via RDS Proxy in AWS.

import { IDeviceRepository } from '../../../domain/repositories/IDeviceRepository';
import { DeviceCryptoOutput } from '../../../domain/entities/Device';
import { generateDeviceCrypto, signDeviceToken } from '../../../infrastructure/crypto';
import { getPool } from './pgPool';

export class PgDeviceRepository implements IDeviceRepository {
  async upsertDevice(
    deviceId: string,
    deviceType: string,
    encryptedDevice?: string,
  ): Promise<DeviceCryptoOutput> {
    const pool = getPool();
    const { key, iv } = generateDeviceCrypto();

    // UPSERT — safe against SQL injection via parameterized queries (OWASP A03)
    const result = await pool.query<{ id: number }>(
      `INSERT INTO devices (device_id, device_type, encrypted_device, key, iv)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (device_id) DO UPDATE
         SET device_type = EXCLUDED.device_type,
             encrypted_device = EXCLUDED.encrypted_device,
             key = EXCLUDED.key,
             iv  = EXCLUDED.iv,
             updated_at = NOW()
       RETURNING id`,
      [deviceId, deviceType, encryptedDevice ?? null, key, iv],
    );

    const certifiedId = result.rows[0]?.id ?? 1;
    const auth_token = signDeviceToken({ deviceId, certifiedId });

    return { key, iv, certified_id: certifiedId, auth_token };
  }

  async authenticateDevice(
    deviceId: string,
    deviceType: string,
    encryptedDevice?: string,
  ): Promise<DeviceCryptoOutput | null> {
    const pool = getPool();
    const { key, iv } = generateDeviceCrypto();

    const result = await pool.query<{ id: number }>(
      `UPDATE devices
       SET key = $1, iv = $2, encrypted_device = $3, updated_at = NOW()
       WHERE device_id = $4
       RETURNING id`,
      [key, iv, encryptedDevice ?? null, deviceId],
    );

    if (result.rowCount === 0) return null;

    const certifiedId = result.rows[0].id;
    const auth_token = signDeviceToken({ deviceId, certifiedId });

    return { key, iv, certified_id: certifiedId, auth_token };
  }
}
