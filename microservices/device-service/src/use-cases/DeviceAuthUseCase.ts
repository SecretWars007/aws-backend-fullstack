// ─── Use Case: DeviceAuthUseCase ─────────────────────────────────────────────
// POST /V1/device/authenticate
// Business rule: Only a previously-registered device can re-authenticate.
// Returns refreshed crypto keys. Throws if device is unknown.

import { IDeviceRepository } from '../domain/repositories/IDeviceRepository';
import { DeviceAuthInput, DeviceCryptoOutput } from '../domain/entities/Device';
import { z } from 'zod';

const schema = z.object({
  device_id: z.string().min(1).max(255),
  device_type: z.string().min(1).max(50),
  certificate: z.boolean().optional().default(true),
  encrypted_device: z.string().optional(),
  send_id: z.string().optional(),
});

export class DeviceAuthUseCase {
  constructor(private readonly deviceRepo: IDeviceRepository) {}

  async execute(input: DeviceAuthInput): Promise<DeviceCryptoOutput> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new Error(`Validation error: ${parsed.error.message}`);
    }

    const { device_id, device_type, encrypted_device } = parsed.data;

    const result = await this.deviceRepo.authenticateDevice(
      device_id,
      device_type,
      encrypted_device,
    );

    if (!result) {
      throw new Error('DEVICE_NOT_FOUND');
    }

    return result;
  }
}
