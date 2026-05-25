// ─── Use Case: DeviceIdentifyUseCase ─────────────────────────────────────────
// POST /V1/device/identification
// Business rule: Any device can identify itself on first contact.
// Returns encryption keys and a device-scoped auth token.

import { IDeviceRepository } from '../domain/repositories/IDeviceRepository';
import { DeviceIdentifyInput, DeviceCryptoOutput } from '../domain/entities/Device';
import { z } from 'zod';

// Input validation schema (OWASP A03 - Input Validation)
const schema = z.object({
  device_id: z.string().min(1).max(255),
  device_type: z.string().min(1).max(50),
  product: z.string().min(1).max(100),
  certificate: z.boolean().optional().default(true),
  encrypted_device: z.string().optional(),
  notification_id: z.string().optional(),
  version: z.string().optional(),
  reference: z.string().optional(),
  send_id: z.string().optional(),
  event: z.number().optional(),
});

export class DeviceIdentifyUseCase {
  constructor(private readonly deviceRepo: IDeviceRepository) {}

  async execute(input: DeviceIdentifyInput): Promise<DeviceCryptoOutput> {
    // Validate input
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new Error(`Validation error: ${parsed.error.message}`);
    }

    const { device_id, device_type, encrypted_device } = parsed.data;

    // Delegate to repository (mock or real depending on MOCK_MODE)
    return this.deviceRepo.upsertDevice(device_id, device_type, encrypted_device);
  }
}
