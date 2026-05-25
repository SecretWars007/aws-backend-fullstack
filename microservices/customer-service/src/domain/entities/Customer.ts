// ─── Customer Domain Entities ─────────────────────────────────────────────────

export interface Customer {
  id: number;
  cellphone: string;
  documentNumber: string;
  documentType: string;
  documentExtension?: string;
  documentComplement?: string;
  email: string;
  cic?: string;
  homeAddress?: string;
  isClient: boolean;
  isMarried: boolean;
  registerCompleted: boolean;
  name?: string;
  lastName?: string;
  secondLastName?: string;
  city?: string;
  pinHash?: string;
  cognitoSub?: string;
  createdAt: Date;
}

export interface Extension {
  name: string;
  extension: string;
  type: string;
}

export interface OtpSession {
  id: number;
  cellphone: string;
  otpHash: string;
  expiresAt: Date;
  verified: boolean;
}

export interface FaceSession {
  sessionId: string;
  cellphone: string;
  expiresAt: Date;
}
