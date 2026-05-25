// ─── JWT Middleware (OWASP A01 - Broken Access Control) ───────────────────────
// Validates the X-Device-Token header on all protected routes.
// The token must be a valid JWT signed by this service.

import { Request, Response, NextFunction } from 'express';
import { verifyDeviceToken } from '../crypto';

declare global {
  namespace Express {
    interface Request {
      deviceContext?: {
        deviceId: string;
        certifiedId: number;
      };
    }
  }
}

/**
 * Middleware: Require a valid X-Device-Token header.
 * Attaches decoded context to req.deviceContext.
 */
export function requireDeviceToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-device-token'] as string | undefined;

  if (!token) {
    res.status(401).json({
      state: -3,
      message: 'X-Device-Token header es requerido',
      data: null,
    });
    return;
  }

  try {
    const decoded = verifyDeviceToken(token);
    req.deviceContext = {
      deviceId: decoded['deviceId'] as string,
      certifiedId: decoded['certifiedId'] as number,
    };
    next();
  } catch {
    res.status(401).json({
      state: -3,
      message: 'Token de dispositivo inválido o expirado',
      data: null,
    });
  }
}
