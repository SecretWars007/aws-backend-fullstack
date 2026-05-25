"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireBodyDeviceToken = requireBodyDeviceToken;
const crypto_1 = require("../crypto");
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
        const decoded = (0, crypto_1.verifyDeviceToken)(auth_token);
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
//# sourceMappingURL=bodyAuthMiddleware.js.map