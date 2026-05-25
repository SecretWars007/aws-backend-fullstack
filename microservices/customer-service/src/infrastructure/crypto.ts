import jwt from 'jsonwebtoken';

const DEVICE_JWT_SECRET = process.env.JWT_DEVICE_SECRET ?? 'zappi-device-secret-CHANGE-IN-PROD';
const USER_JWT_SECRET = process.env.JWT_USER_SECRET ?? 'zappi-user-secret-CHANGE-IN-PROD';

/**
 * Verify a device JWT (HS256) from auth_token body parameter.
 */
export function verifyDeviceToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, DEVICE_JWT_SECRET) as jwt.JwtPayload;
}

/**
 * Sign a user JWT (mock private_token) with a 1-hour expiry.
 */
export function signUserToken(payload: {
  userId: number;
  cellphone: string;
  role: string;
}): string {
  return jwt.sign(
    payload,
    USER_JWT_SECRET,
    { expiresIn: '1h', algorithm: 'HS256' }
  );
}

/**
 * Verify a user JWT (private_token).
 */
export function verifyUserToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, USER_JWT_SECRET) as jwt.JwtPayload;
}
