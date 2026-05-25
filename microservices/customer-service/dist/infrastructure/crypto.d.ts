import jwt from 'jsonwebtoken';
/**
 * Verify a device JWT (HS256) from auth_token body parameter.
 */
export declare function verifyDeviceToken(token: string): jwt.JwtPayload;
/**
 * Sign a user JWT (mock private_token) with a 1-hour expiry.
 */
export declare function signUserToken(payload: {
    userId: number;
    cellphone: string;
    role: string;
}): string;
/**
 * Verify a user JWT (private_token).
 */
export declare function verifyUserToken(token: string): jwt.JwtPayload;
