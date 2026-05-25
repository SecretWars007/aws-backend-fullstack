"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDeviceToken = verifyDeviceToken;
exports.signUserToken = signUserToken;
exports.verifyUserToken = verifyUserToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const DEVICE_JWT_SECRET = process.env.JWT_DEVICE_SECRET ?? 'zappi-device-secret-CHANGE-IN-PROD';
const USER_JWT_SECRET = process.env.JWT_USER_SECRET ?? 'zappi-user-secret-CHANGE-IN-PROD';
/**
 * Verify a device JWT (HS256) from auth_token body parameter.
 */
function verifyDeviceToken(token) {
    return jsonwebtoken_1.default.verify(token, DEVICE_JWT_SECRET);
}
/**
 * Sign a user JWT (mock private_token) with a 1-hour expiry.
 */
function signUserToken(payload) {
    return jsonwebtoken_1.default.sign(payload, USER_JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
}
/**
 * Verify a user JWT (private_token).
 */
function verifyUserToken(token) {
    return jsonwebtoken_1.default.verify(token, USER_JWT_SECRET);
}
//# sourceMappingURL=crypto.js.map