"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalancesHandler = getBalancesHandler;
exports.getRechargeParamsHandler = getRechargeParamsHandler;
exports.rechargeEntelHandler = rechargeEntelHandler;
exports.rechargeTigoHandler = rechargeTigoHandler;
exports.rechargeVivaHandler = rechargeVivaHandler;
exports.transferValidateHandler = transferValidateHandler;
exports.transferTokenGenerateHandler = transferTokenGenerateHandler;
exports.transferExecuteHandler = transferExecuteHandler;
exports.createInternalWalletHandler = createInternalWalletHandler;
exports.getMovementsHandler = getMovementsHandler;
const BalancesUseCase_1 = require("../../use-cases/BalancesUseCase");
const RechargeParamsUseCase_1 = require("../../use-cases/RechargeParamsUseCase");
const RechargeEntelUseCase_1 = require("../../use-cases/RechargeEntelUseCase");
const RechargeTigoUseCase_1 = require("../../use-cases/RechargeTigoUseCase");
const RechargeVivaUseCase_1 = require("../../use-cases/RechargeVivaUseCase");
const TransferValidateUseCase_1 = require("../../use-cases/TransferValidateUseCase");
const TokenGenerateUseCase_1 = require("../../use-cases/TokenGenerateUseCase");
const TransferExecuteUseCase_1 = require("../../use-cases/TransferExecuteUseCase");
const MovementsUseCase_1 = require("../../use-cases/MovementsUseCase");
function success(res, data, message = 'Operación exitosa') {
    return res.status(200).json({ state: 0, message, data });
}
function businessError(res, message, code) {
    return res.status(400).json({ state: 1, message, code });
}
function serverError(res, message = 'Error interno en Wallet Service') {
    return res.status(500).json({ state: -1, message, code: 'INTERNAL_SERVER_ERROR' });
}
// 1. POST /V1/client/walletcards/information/get
function getBalancesHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new BalancesUseCase_1.BalancesUseCase(repo);
            // Look up customer by certifiedId or default to 3 (Gustavo Parker)
            const customerId = req.deviceContext?.certifiedId ?? 3;
            const result = await useCase.execute(customerId);
            success(res, result);
        }
        catch (err) {
            console.error('[GetBalances]', err.message);
            serverError(res);
        }
    };
}
// 2. POST /V1/recharge/parameters/get
function getRechargeParamsHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new RechargeParamsUseCase_1.RechargeParamsUseCase(repo);
            const result = await useCase.execute();
            success(res, result);
        }
        catch (err) {
            console.error('[GetRechargeParams]', err.message);
            serverError(res);
        }
    };
}
// 3. POST /V1/recharge/entel
function rechargeEntelHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new RechargeEntelUseCase_1.RechargeEntelUseCase(repo);
            const customerId = req.deviceContext?.certifiedId ?? 3;
            const result = await useCase.execute(customerId, req.body);
            success(res, result, 'Recarga Entel realizada con éxito');
        }
        catch (err) {
            console.error('[RechargeEntel]', err.message);
            if (err.message === 'INSUFFICIENT_FUNDS') {
                businessError(res, 'Fondos insuficientes en su billetera', err.message);
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
// 4. POST /V1/recharge/tigo
function rechargeTigoHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new RechargeTigoUseCase_1.RechargeTigoUseCase(repo);
            const customerId = req.deviceContext?.certifiedId ?? 3;
            const result = await useCase.execute(customerId, req.body);
            success(res, result, 'Recarga Tigo realizada con éxito');
        }
        catch (err) {
            console.error('[RechargeTigo]', err.message);
            if (err.message === 'INSUFFICIENT_FUNDS') {
                businessError(res, 'Fondos insuficientes en su billetera', err.message);
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
// 5. POST /V1/recharge/viva
function rechargeVivaHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new RechargeVivaUseCase_1.RechargeVivaUseCase(repo);
            const customerId = req.deviceContext?.certifiedId ?? 3;
            const result = await useCase.execute(customerId, req.body);
            success(res, result, 'Recarga Viva realizada con éxito');
        }
        catch (err) {
            console.error('[RechargeViva]', err.message);
            if (err.message === 'INSUFFICIENT_FUNDS') {
                businessError(res, 'Fondos insuficientes en su billetera', err.message);
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
// 6. POST /V1/transfers/validate
function transferValidateHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new TransferValidateUseCase_1.TransferValidateUseCase(repo);
            const result = await useCase.execute(req.body);
            success(res, result, 'OK');
        }
        catch (err) {
            console.error('[TransferValidate]', err.message);
            if (err.message === 'RECIPIENT_NOT_FOUND') {
                businessError(res, 'El número de celular de destino no está registrado en Zappi', err.message);
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
// 7. POST /V1/transfers/token/generate
function transferTokenGenerateHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new TokenGenerateUseCase_1.TokenGenerateUseCase(repo);
            const customerId = req.deviceContext?.certifiedId ?? 3;
            const result = await useCase.execute(customerId, req.body);
            success(res, result, 'OK');
        }
        catch (err) {
            console.error('[TransferTokenGen]', err.message);
            if (err.message.startsWith('Validation error')) {
                businessError(res, err.message, 'VALIDATION_ERROR');
                return;
            }
            serverError(res);
        }
    };
}
// 8. POST /V1/transfers/execute
function transferExecuteHandler(repo) {
    return async (req, res) => {
        try {
            const useCase = new TransferExecuteUseCase_1.TransferExecuteUseCase(repo);
            const customerId = req.deviceContext?.certifiedId ?? 3;
            const result = await useCase.execute(customerId, req.body);
            success(res, result, 'Transferencia realizada con éxito');
        }
        catch (err) {
            console.error('[TransferExecute]', err.message);
            if (err.message === 'INSUFFICIENT_FUNDS' || err.message === 'INVALID_OR_EXPIRED_TOKEN' || err.message === 'TOKEN_EXPIRED' || err.message === 'TRANSACTION_DETAILS_MISMATCH') {
                businessError(res, 'No se pudo realizar la transferencia. Verifique fondos o el token.', err.message);
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
// 9. POST /internal/wallet/create (Internal, called by customer-service during signup)
function createInternalWalletHandler(repo) {
    return async (req, res) => {
        try {
            const { customerId, cellphone } = req.body;
            if (!customerId || !cellphone) {
                res.status(400).json({ error: 'customerId and cellphone are required' });
                return;
            }
            const card = await repo.createWalletCard(Number(customerId), cellphone);
            res.status(201).json(card);
        }
        catch (err) {
            console.error('[InternalWalletCreate]', err.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
// 10. POST /V1/movements & /v1/movements
function getMovementsHandler(repo) {
    return async (req, res) => {
        try {
            const customerId = req.deviceContext?.certifiedId ?? 3;
            const cards = await repo.getWalletCards(customerId);
            const balance = cards[0]?.balance ?? 1250.50;
            const useCase = new MovementsUseCase_1.MovementsUseCase(repo);
            const movements = await useCase.execute(customerId);
            const formattedMovements = movements.map(m => ({
                date: m.date,
                amount: m.amount,
                currency: m.currency,
                description: m.amount < 0 ? 'DEBITO' : 'CREDITO',
                detail: m.description, // e.g., 'BL PAGO TIGO' or 'TRANSFERENCIA'
            }));
            success(res, {
                balance,
                movements: formattedMovements,
            }, 'Movimientos obtenidos correctamente');
        }
        catch (err) {
            console.error('[GetMovements]', err.message);
            serverError(res);
        }
    };
}
//# sourceMappingURL=walletControllers.js.map