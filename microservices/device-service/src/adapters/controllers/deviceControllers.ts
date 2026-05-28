// ─── Controller: Device Identify ──────────────────────────────────────────────
// Translates HTTP request → Use Case input → HTTP response.
// No business logic here — only HTTP protocol translation.

import { Request, Response } from 'express';
import { DeviceIdentifyUseCase } from '../../use-cases/DeviceIdentifyUseCase';
import { DeviceAuthUseCase } from '../../use-cases/DeviceAuthUseCase';
import { IDeviceRepository } from '../../domain/repositories/IDeviceRepository';

// ─── Standard API response helpers ───────────────────────────────────────────
function success(res: Response, data: unknown, message = 'OK') {
  return res.status(200).json({ state: 0, message, data });
}

function unauthorized(res: Response, message = 'Token de dispositivo inválido o expirado') {
  return res.status(401).json({ state: 1, message, code: 'UNAUTHORIZED' });
}

function notFound(res: Response, message = 'Dispositivo no registrado') {
  return res.status(404).json({ state: 1, message, code: 'NOT_FOUND' });
}

function serverError(res: Response, message = 'Error interno del servidor') {
  return res.status(500).json({ state: -1, message, code: 'INTERNAL_SERVER_ERROR' });
}

function businessError(res: Response, message: string, code: string) {
  return res.status(400).json({ state: 1, message, code });
}

// ─── POST /V1/device/identification ──────────────────────────────────────────
export function deviceIdentifyHandler(repo: IDeviceRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new DeviceIdentifyUseCase(repo);
      const result = await useCase.execute(req.body);
      success(res, result, 'OK');
    } catch (err: any) {
      console.error('[DeviceIdentify]', err.message);
      if (err.message.startsWith('Validation error')) {
        businessError(res, err.message, 'VALIDATION_ERROR');
        return;
      }
      serverError(res);
    }
  };
}

// ─── POST /V1/device/authenticate ────────────────────────────────────────────
export function deviceAuthHandler(repo: IDeviceRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new DeviceAuthUseCase(repo);
      const result = await useCase.execute(req.body);
      success(res, result, 'OK');
    } catch (err: any) {
      console.error('[DeviceAuth]', err.message);
      if (err.message === 'DEVICE_NOT_FOUND') {
        notFound(res);
        return;
      }
      if (err.message.startsWith('Validation error')) {
        businessError(res, err.message, 'VALIDATION_ERROR');
        return;
      }
      serverError(res);
    }
  };
}
