import { Request, Response } from 'express';
import { IWalletRepository } from '../../domain/repositories/IWalletRepository';
import { BalancesUseCase } from '../../use-cases/BalancesUseCase';
import { RechargeParamsUseCase } from '../../use-cases/RechargeParamsUseCase';
import { RechargeEntelUseCase } from '../../use-cases/RechargeEntelUseCase';
import { RechargeTigoUseCase } from '../../use-cases/RechargeTigoUseCase';
import { RechargeVivaUseCase } from '../../use-cases/RechargeVivaUseCase';
import { TransferValidateUseCase } from '../../use-cases/TransferValidateUseCase';
import { TokenGenerateUseCase } from '../../use-cases/TokenGenerateUseCase';
import { TransferExecuteUseCase } from '../../use-cases/TransferExecuteUseCase';
import { MovementsUseCase } from '../../use-cases/MovementsUseCase';

function success(res: Response, data: unknown, message = 'Operación exitosa') {
  return res.status(200).json({ state: 0, message, data });
}

function businessError(res: Response, message: string, code: string) {
  return res.status(400).json({ state: 1, message, code });
}

function serverError(res: Response, message = 'Error interno en Wallet Service') {
  return res.status(500).json({ state: -1, message, code: 'INTERNAL_SERVER_ERROR' });
}

// 1. POST /V1/client/walletcards/information/get
export function getBalancesHandler(repo: IWalletRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new BalancesUseCase(repo);
      
      // Look up customer by certifiedId or default to 3 (Gustavo Parker)
      const customerId = (req as any).deviceContext?.certifiedId ?? 3;
      
      const result = await useCase.execute(customerId);
      success(res, result);
    } catch (err: any) {
      console.error('[GetBalances]', err.message);
      serverError(res);
    }
  };
}

// 2. POST /V1/recharge/parameters/get
export function getRechargeParamsHandler(repo: IWalletRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new RechargeParamsUseCase(repo);
      const result = await useCase.execute();
      success(res, result);
    } catch (err: any) {
      console.error('[GetRechargeParams]', err.message);
      serverError(res);
    }
  };
}

// 3. POST /V1/recharge/entel
export function rechargeEntelHandler(repo: IWalletRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new RechargeEntelUseCase(repo);
      const customerId = (req as any).deviceContext?.certifiedId ?? 3;
      const result = await useCase.execute(customerId, req.body);
      success(res, result, 'Recarga Entel realizada con éxito');
    } catch (err: any) {
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
export function rechargeTigoHandler(repo: IWalletRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new RechargeTigoUseCase(repo);
      const customerId = (req as any).deviceContext?.certifiedId ?? 3;
      const result = await useCase.execute(customerId, req.body);
      success(res, result, 'Recarga Tigo realizada con éxito');
    } catch (err: any) {
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
export function rechargeVivaHandler(repo: IWalletRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new RechargeVivaUseCase(repo);
      const customerId = (req as any).deviceContext?.certifiedId ?? 3;
      const result = await useCase.execute(customerId, req.body);
      success(res, result, 'Recarga Viva realizada con éxito');
    } catch (err: any) {
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
export function transferValidateHandler(repo: IWalletRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new TransferValidateUseCase(repo);
      const result = await useCase.execute(req.body);
      success(res, result, 'OK');
    } catch (err: any) {
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
export function transferTokenGenerateHandler(repo: IWalletRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new TokenGenerateUseCase(repo);
      const customerId = (req as any).deviceContext?.certifiedId ?? 3;
      const result = await useCase.execute(customerId, req.body);
      success(res, result, 'OK');
    } catch (err: any) {
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
export function transferExecuteHandler(repo: IWalletRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new TransferExecuteUseCase(repo);
      const customerId = (req as any).deviceContext?.certifiedId ?? 3;
      const result = await useCase.execute(customerId, req.body);
      success(res, result, 'Transferencia realizada con éxito');
    } catch (err: any) {
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
export function createInternalWalletHandler(repo: IWalletRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, cellphone } = req.body;
      if (!customerId || !cellphone) {
        res.status(400).json({ error: 'customerId and cellphone are required' });
        return;
      }
      const card = await repo.createWalletCard(Number(customerId), cellphone);
      res.status(201).json(card);
    } catch (err: any) {
      console.error('[InternalWalletCreate]', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// 10. POST /V1/movements & /v1/movements
export function getMovementsHandler(repo: IWalletRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId = (req as any).deviceContext?.certifiedId ?? 3;
      const cards = await repo.getWalletCards(customerId);
      const balance = cards[0]?.balance ?? 1250.50;

      const useCase = new MovementsUseCase(repo);
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
    } catch (err: any) {
      console.error('[GetMovements]', err.message);
      serverError(res);
    }
  };
}
