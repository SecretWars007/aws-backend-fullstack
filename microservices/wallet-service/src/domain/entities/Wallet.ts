export interface WalletCard {
  id: number;
  customerId: number;
  account: {
    number: string;
    currency: string;
    type: string;
  };
  balance: number;
  pan: string;
  expirationDate: string;
  code: string;
  image: string;
  enable: boolean;
  createdAt: Date;
}

export interface WalletMovement {
  id: number;
  customerId: number;
  date: string;
  amount: number;
  currency: string;
  type: number; // E.g., 12 for Tigo, 13 for Entel, 14 for Viva, 1 for Transfer
  description: string;
  detail: string;
  destinationAccount: string;
  destinationAccountName: string | null;
  createdAt: Date;
}

export interface RechargeProvider {
  name: string;
  code: number;
  logo: string;
}

export interface TransferSession {
  id: number;
  customerId: number;
  cellphone: string;
  amount: number;
  token: string;
  expiresAt: Date;
}
