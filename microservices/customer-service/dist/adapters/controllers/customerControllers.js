"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExtensionCatalogHandler = getExtensionCatalogHandler;
exports.validateUserHandler = validateUserHandler;
exports.validateOtpHandler = validateOtpHandler;
exports.initFaceRecognitionHandler = initFaceRecognitionHandler;
exports.executeFaceRecognitionHandler = executeFaceRecognitionHandler;
exports.registerReferenceCodeHandler = registerReferenceCodeHandler;
exports.createAccountHandler = createAccountHandler;
exports.loginHandler = loginHandler;
exports.getProfileParametersHandler = getProfileParametersHandler;
exports.welcomeReferenceHandler = welcomeReferenceHandler;
exports.getInternalCustomerByPhoneHandler = getInternalCustomerByPhoneHandler;
const DocumentExtensionsUseCase_1 = require("../../use-cases/DocumentExtensionsUseCase");
const UsersValidateUseCase_1 = require("../../use-cases/UsersValidateUseCase");
const OtpValidateUseCase_1 = require("../../use-cases/OtpValidateUseCase");
const FaceRecognitionInitUseCase_1 = require("../../use-cases/FaceRecognitionInitUseCase");
const FaceRecognitionValidUseCase_1 = require("../../use-cases/FaceRecognitionValidUseCase");
const ReferenceRegisterUseCase_1 = require("../../use-cases/ReferenceRegisterUseCase");
const UsersCreateUseCase_1 = require("../../use-cases/UsersCreateUseCase");
const SignInUseCase_1 = require("../../use-cases/SignInUseCase");
const ParametersUseCase_1 = require("../../use-cases/ParametersUseCase");
// Helpers
function success(res, data, message = 'OK') {
    return res.status(200).json({ state: 0, message, data });
}
function businessError(res, message, code) {
    return res.status(400).json({ state: 1, message, code });
}
function serverError(res, message = 'Error interno del servidor') {
    return res.status(500).json({ state: -1, message, code: 'INTERNAL_SERVER_ERROR' });
}
// 1. POST /V1/client/device/register/extension/get
function getExtensionCatalogHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new DocumentExtensionsUseCase_1.DocumentExtensionsUseCase(repo);
            const result = await useCase.execute();
            success(res, result);
        }
        catch (err) {
            console.error('[GetExtensions]', err.message);
            serverError(res);
        }
    };
}
// 2. POST /V1/register/validate/user
function validateUserHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new UsersValidateUseCase_1.UsersValidateUseCase(repo);
            const result = await useCase.execute(req.body);
            success(res, result);
        }
        catch (err) {
            console.error('[ValidateUser]', err.message);
            if (err.message.startsWith('Validation error')) {
                businessError(res, err.message, 'VALIDATION_ERROR');
                return;
            }
            serverError(res);
        }
    };
}
// 3. POST /V1/register/validate/otp
function validateOtpHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new OtpValidateUseCase_1.OtpValidateUseCase(repo);
            const result = await useCase.execute(req.body);
            success(res, result);
        }
        catch (err) {
            console.error('[ValidateOtp]', err.message);
            if (err.message === 'OTP_NOT_FOUND' || err.message === 'OTP_EXPIRED' || err.message === 'OTP_INVALID') {
                businessError(res, 'OTP inválido o expirado. Solicite uno nuevo.', err.message);
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
// 4. POST /V1/register/init/face/recognition
function initFaceRecognitionHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new FaceRecognitionInitUseCase_1.FaceRecognitionInitUseCase(repo);
            const result = await useCase.execute(req.body);
            success(res, result);
        }
        catch (err) {
            console.error('[InitFace]', err.message);
            if (err.message.startsWith('Validation error')) {
                businessError(res, err.message, 'VALIDATION_ERROR');
                return;
            }
            serverError(res);
        }
    };
}
// 5. POST /V1/register/execute/face/recognition
function executeFaceRecognitionHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new FaceRecognitionValidUseCase_1.FaceRecognitionValidUseCase(repo);
            const result = await useCase.execute(req.body);
            success(res, result);
        }
        catch (err) {
            console.error('[ExecFace]', err.message);
            if (err.message === 'FACE_SESSION_NOT_FOUND' || err.message === 'FACE_SESSION_EXPIRED') {
                businessError(res, 'Sesión biométrica inválida o expirada', err.message);
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
// 6. POST /V1/client/reference/register/code
function registerReferenceCodeHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new ReferenceRegisterUseCase_1.ReferenceRegisterUseCase(repo);
            const result = await useCase.execute(req.body);
            success(res, result);
        }
        catch (err) {
            console.error('[RegisterReference]', err.message);
            if (err.message === 'CUSTOMER_NOT_FOUND') {
                businessError(res, 'Usuario no encontrado', err.message);
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
// 7. POST /V1/register/create/account
function createAccountHandler(repo, walletServiceUrl) {
    return async (req, res) => {
        try {
            const useCase = new UsersCreateUseCase_1.UsersCreateUseCase(repo, walletServiceUrl);
            const result = await useCase.execute(req.body);
            success(res, result);
        }
        catch (err) {
            console.error('[CreateAccount]', err.message);
            if (err.message === 'CUSTOMER_NOT_FOUND' || err.message === 'OTP_NOT_FOUND' || err.message === 'OTP_NOT_VERIFIED') {
                businessError(res, 'No se pudo crear la cuenta. Verifique el código OTP.', err.message);
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
// 8. POST /V1/client/login/get
function loginHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new SignInUseCase_1.SignInUseCase(repo);
            const result = await useCase.execute(req.body);
            success(res, result, 'Bienvenido a Zappi');
        }
        catch (err) {
            console.error('[Login]', err.message);
            if (err.message === 'INVALID_CREDENTIALS') {
                businessError(res, 'Número de celular o PIN incorrecto', err.message);
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
// 9. POST /V1/profile/parameters/get
function getProfileParametersHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new ParametersUseCase_1.ParametersUseCase(repo);
            // Look up customer based on device context from verified body token
            const certifiedId = req.deviceContext?.certifiedId;
            // If we have a certifiedId, we query the customer.
            // In Mock mode, ParametersUseCase handles missing/fallback to Gustavo Parker (id=3) automatically.
            const result = await useCase.execute(certifiedId ?? 3);
            success(res, result);
        }
        catch (err) {
            console.error('[GetProfileParams]', err.message);
            serverError(res);
        }
    };
}
// 10. POST /V1/client/reference/welcome (Intentional 404 per PDF/spec)
function welcomeReferenceHandler(req, res) {
    const version = req.params.version ?? 'V1';
    res.status(404).send(`<!DOCTYPE html><html><body><pre>Cannot POST /${version}/client/reference/welcome</pre></body></html>`);
}
// 11. GET /internal/customer/phone/:cellphone (Internal inter-service routing)
function getInternalCustomerByPhoneHandler(repo) {
    return async (req, res) => {
        try {
            const { cellphone } = req.params;
            const customer = await repo.findCustomerByCellphone(cellphone);
            if (!customer) {
                res.status(404).json({ error: 'Customer not found' });
                return;
            }
            res.status(200).json({
                id: customer.id,
                name: `${customer.name ?? 'GUSTAVO'} ${customer.lastName ?? 'PARKER'}`.trim(),
            });
        }
        catch (err) {
            console.error('[InternalGetCustomer]', err.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
//# sourceMappingURL=customerControllers.js.map