// ─── Mock Device Repository ───────────────────────────────────────────────────
// Active when MOCK_MODE=true
// Returns deterministic hardcoded responses matching the PDF spec.
// No real database connection needed — perfect for frontend integration testing.

import { IDeviceRepository } from '../../../domain/repositories/IDeviceRepository';
import { DeviceCryptoOutput } from '../../../domain/entities/Device';
import { generateDeviceCrypto, signDeviceToken } from '../../../infrastructure/crypto';

export class MockDeviceRepository implements IDeviceRepository {
  // Simple in-memory store for mock mode (process lifetime only)
  private readonly store = new Map<string, { certifiedId: number }>();
  private nextId = 1;

  async upsertDevice(
    deviceId: string,
    deviceType: string,
    _encryptedDevice?: string,
  ): Promise<DeviceCryptoOutput> {
    // Assign or retrieve a mock certified_id for this device
    if (!this.store.has(deviceId)) {
      this.store.set(deviceId, { certifiedId: this.nextId++ });
    }
    const { certifiedId } = this.store.get(deviceId)!;

    const { key, iv } = generateDeviceCrypto();
    const auth_token = signDeviceToken({ deviceId, certifiedId });

    return { key, iv, certified_id: certifiedId, auth_token };
  }

  async authenticateDevice(
    deviceId: string,
    deviceType: string,
    _encryptedDevice?: string,
  ): Promise<DeviceCryptoOutput | null> {
    // In mock mode, always consider device as registered
    const { certifiedId } = this.store.get(deviceId) ?? { certifiedId: 1 };

    const { key, iv } = generateDeviceCrypto();
    const auth_token = signDeviceToken({ deviceId, certifiedId });

    return { key, iv, certified_id: certifiedId, auth_token };
  }
}
