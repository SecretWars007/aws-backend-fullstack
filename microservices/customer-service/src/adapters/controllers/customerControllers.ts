import { Request, Response } from 'express';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { DocumentExtensionsUseCase } from '../../use-cases/DocumentExtensionsUseCase';
import { UsersValidateUseCase } from '../../use-cases/UsersValidateUseCase';
import { OtpValidateUseCase } from '../../use-cases/OtpValidateUseCase';
import { FaceRecognitionInitUseCase } from '../../use-cases/FaceRecognitionInitUseCase';
import { FaceRecognitionValidUseCase } from '../../use-cases/FaceRecognitionValidUseCase';
import { ReferenceRegisterUseCase } from '../../use-cases/ReferenceRegisterUseCase';
import { UsersCreateUseCase } from '../../use-cases/UsersCreateUseCase';
import { SignInUseCase } from '../../use-cases/SignInUseCase';
import { ParametersUseCase } from '../../use-cases/ParametersUseCase';

// Helpers
function success(res: Response, data: unknown, message = 'OK') {
  return res.status(200).json({ state: 0, message, data });
}

function businessError(res: Response, message: string, code: string) {
  return res.status(400).json({ state: 1, message, code });
}

function serverError(res: Response, message = 'Error interno del servidor') {
  return res.status(500).json({ state: -1, message, code: 'INTERNAL_SERVER_ERROR' });
}

// 1. POST /V1/client/device/register/extension/get
export function getExtensionCatalogHandler(repo: ICustomerRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new DocumentExtensionsUseCase(repo);
      const result = await useCase.execute();
      success(res, result);
    } catch (err: any) {
      console.error('[GetExtensions]', err.message);
      serverError(res);
    }
  };
}

// 2. POST /V1/register/validate/user
export function validateUserHandler(repo: ICustomerRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new UsersValidateUseCase(repo);
      const result = await useCase.execute(req.body);
      success(res, result);
    } catch (err: any) {
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
export function validateOtpHandler(repo: ICustomerRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new OtpValidateUseCase(repo);
      const result = await useCase.execute(req.body);
      success(res, result);
    } catch (err: any) {
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
export function initFaceRecognitionHandler(repo: ICustomerRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new FaceRecognitionInitUseCase(repo);
      const result = await useCase.execute(req.body);
      success(res, result);
    } catch (err: any) {
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
export function executeFaceRecognitionHandler(repo: ICustomerRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new FaceRecognitionValidUseCase(repo);
      const result = await useCase.execute(req.body);
      success(res, result);
    } catch (err: any) {
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
export function registerReferenceCodeHandler(repo: ICustomerRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new ReferenceRegisterUseCase(repo);
      const result = await useCase.execute(req.body);
      success(res, result);
    } catch (err: any) {
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
export function createAccountHandler(repo: ICustomerRepository, walletServiceUrl: string) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new UsersCreateUseCase(repo, walletServiceUrl);
      const result = await useCase.execute(req.body);
      success(res, result);
    } catch (err: any) {
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
export function loginHandler(repo: ICustomerRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new SignInUseCase(repo);
      const result = await useCase.execute(req.body);
      success(res, result, 'Bienvenido a Zappi');
    } catch (err: any) {
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
export function getProfileParametersHandler(repo: ICustomerRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const useCase = new ParametersUseCase(repo);
      
      // Look up customer based on device context from verified body token
      const certifiedId = (req as any).deviceContext?.certifiedId;
      
      // If we have a certifiedId, we query the customer.
      // In Mock mode, ParametersUseCase handles missing/fallback to Gustavo Parker (id=3) automatically.
      const result = await useCase.execute(certifiedId ?? 3);
      success(res, result);
    } catch (err: any) {
      console.error('[GetProfileParams]', err.message);
      serverError(res);
    }
  };
}

// 10. POST /V1/client/reference/welcome (Intentional 404 per PDF/spec)
export function welcomeReferenceHandler(req: Request, res: Response): void {
  const version = req.params.version ?? 'V1';
  res.status(404).send(`<!DOCTYPE html><html><body><pre>Cannot POST /${version}/client/reference/welcome</pre></body></html>`);
}

// 11. GET /internal/customer/phone/:cellphone (Internal inter-service routing)
export function getInternalCustomerByPhoneHandler(repo: ICustomerRepository) {
  return async (req: Request, res: Response): Promise<void> => {
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
    } catch (err: any) {
      console.error('[InternalGetCustomer]', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
