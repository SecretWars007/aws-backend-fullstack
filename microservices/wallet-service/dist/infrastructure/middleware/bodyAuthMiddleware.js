"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireBodyDeviceToken = requireBodyDeviceToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const DEVICE_JWT_SECRET = process.env.JWT_DEVICE_SECRET ?? 'zappi-device-secret-CHANGE-IN-PROD';
function requireBodyDeviceToken(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(auth_token, DEVICE_JWT_SECRET);
        req.deviceContext = {
            deviceId: decoded.deviceId,
            certifiedId: decoded.certifiedId,
        };
        next();
    }
    catch (err) {
        res.status(401).json({
            state: 1,
            message: 'Token de dispositivo inválido o expirado',
            code: 'INVALID_AUTH_TOKEN',
        });
    }
}
