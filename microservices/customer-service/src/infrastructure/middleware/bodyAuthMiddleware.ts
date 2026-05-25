import { Request, Response, NextFunction } from 'express';
import { verifyDeviceToken } from '../crypto';

export function requireBodyDeviceToken(req: Request, res: Response, next: NextFunction): void {
  const { auth_token } = req.body;

  if (!auth_token) {
    res.status(401).json({
      state: 1,
      message: 'El parámetro auth_token es requerido en el cuerpo',
      code: 'AUTH_TOKEN_REQUIRED',
    });
    return;
  }

  try {
    const decoded = verifyDeviceToken(auth_token);
    (req as any).deviceContext = {
      deviceId: decoded.deviceId,
      certifiedId: decoded.certifiedId,
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      state: 1,
      message: 'Token de dispositivo inválido o expirado',
      code: 'INVALID_AUTH_TOKEN',
    });
  }
}
