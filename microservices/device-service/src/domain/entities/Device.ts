// ─── Domain Entity: Device ────────────────────────────────────────────────────
// Represents the core business concept of a registered mobile device.
// No framework dependencies — pure TypeScript.

export interface Device {
  id: number;
  deviceId: string;
  deviceType: string;
  encryptedDevice?: string;
  key: string;
  iv: string;
  authToken: string;
  certifiedId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceIdentifyInput {
  event?: number;
  notification_id?: string;
  product: string;
  reference?: string;
  version?: string;
  certificate: boolean;
  device_id: string;
  device_type: string;
  encrypted_device?: string;
  send_id?: string;
}

export interface DeviceAuthInput {
  certificate: boolean;
  device_id: string;
  device_type: string;
  encrypted_device?: string;
  send_id?: string;
}

export interface DeviceCryptoOutput {
  key: string;
  iv: string;
  certified_id: number;
  auth_token: string;
}
