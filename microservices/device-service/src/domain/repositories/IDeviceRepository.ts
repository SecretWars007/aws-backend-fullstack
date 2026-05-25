// ─── Repository Interface: IDeviceRepository ─────────────────────────────────
// Defines the contract that all repository implementations must fulfil.
// The Use Cases depend ONLY on this interface (Dependency Inversion Principle).

import { DeviceCryptoOutput } from '../entities/Device';

export interface IDeviceRepository {
  /**
   * Upsert a device record and return crypto keys + signed auth token.
   * Used by: DeviceIdentifyUseCase
   */
  upsertDevice(
    deviceId: string,
    deviceType: string,
    encryptedDevice?: string,
  ): Promise<DeviceCryptoOutput>;

  /**
   * Authenticate an already-registered device.
   * Returns fresh crypto keys. Returns null if device not found.
   * Used by: DeviceAuthUseCase
   */
  authenticateDevice(
    deviceId: string,
    deviceType: string,
    encryptedDevice?: string,
  ): Promise<DeviceCryptoOutput | null>;
}
