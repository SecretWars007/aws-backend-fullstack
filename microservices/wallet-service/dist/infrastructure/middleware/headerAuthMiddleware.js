"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireHeaderDeviceToken = requireHeaderDeviceToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const DEVICE_JWT_SECRET = process.env.JWT_DEVICE_SECRET ?? 'zappi-device-secret-CHANGE-IN-PROD';
function requireHeaderDeviceToken(req, res, next) {
    // Extract token from Authorization header (Bearer <token>) or auth_token header
    let auth_token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        auth_token = authHeader.substring(7).trim();
    }
    else if (req.headers['auth_token']) {
        auth_token = req.headers['auth_token'];
    }
    else if (req.headers['auth-token']) {
        auth_token = req.headers['auth-token'];
    }
    if (!auth_token) {
        res.status(401).json({
            state: 1,
            message: 'El header Authorization con token Bearer es requerido',
            code: 'AUTH_TOKEN_REQUIRED_IN_HEADER',
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(auth_token, DEVICE_JWT_SECRET);
        req.deviceContext = {
            deviceId: decoded.deviceId,
            certifiedId: decoded.certifiedId,
        };
        // INJECTION: Mapear el token validado devuelta a req.body para que Zod y Casos de Uso funcionen.
        if (!req.body)
            req.body = {};
        req.body.auth_token = auth_token;
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
//# sourceMappingURL=headerAuthMiddleware.js.map