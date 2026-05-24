// ─────────────────────────────────────────────────────────────────────────────
// Shared API types matching the Smithy models
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  state: number;
  message: string;
  data?: T;
}

export interface TransactionData {
  code: string;
  transaction_id: number;
  date: string;
}

// ── 1. Device Identification ─────────────────────────────────────────────────
export interface DeviceIdentificationInput {
  event: number;
  notification_id?: string;
  product: string;
  reference?: string;
  version?: string;
  certificate: boolean;
  device_id: string;
  device_type: string;
  encrypted_device?: string;
  send_id?: string;
}

export interface DeviceIdentificationData {
  key: string;
  iv: string;
  certified_id: number;
  auth_token: string;
}

// ── 2. Device Authenticate ───────────────────────────────────────────────────
export interface DeviceAuthenticateInput {
  certificate: boolean;
  device_id: string;
  device_type: string;
  encrypted_device?: string;
  send_id?: string;
}

export interface DeviceAuthData {
  key: string;
  iv: string;
  certified_id: number;
  auth_token: string;
}

// ── 3. Extension Catalog ─────────────────────────────────────────────────────
export interface Extension {
  name: string;
  extension: string;
  type: string;
}

// ── 4. Validate User ─────────────────────────────────────────────────────────
export interface ValidateUserInput {
  cellphone: string;
  certified_id: number;
  document_complement?: string;
  document_extension?: string;
  document_number: string;
  document_type: string;
  email: string;
  auth_token: string;
}

export interface ValidateUserData {
  id: number;
  cic: string;
  home_address: string;
  is_client: boolean;
  is_married: boolean;
}

// ── 5. Validate OTP ──────────────────────────────────────────────────────────
export interface ValidateOtpInput {
  cellphone: string;
  certified_id: number;
  otp: string;
  auth_token: string;
}

// ── 6 & 7. Face Recognition ──────────────────────────────────────────────────
export interface FaceRecognitionInitInput {
  cellphone: string;
  certified_id: number;
  document_number: string;
  document_type: string;
  document_extension?: string;
  document_complement?: string;
  auth_token: string;
}

export interface FaceRecognitionInitData {
  instruction: string;
  image: string;
  session_id: string;
}

export interface ExecuteFaceRecognitionInput {
  session_id: string;
  selfie: string;
  certified_id: number;
  auth_token: string;
}

// ── 8. Reference Code ────────────────────────────────────────────────────────
export interface RegisterReferenceCodeInput {
  cellphone: string;
  code: string;
  id: number;
  auth_token: string;
}

// ── 9. Create Account ────────────────────────────────────────────────────────
export interface CreateAccountInput {
  cellphone: string;
  certified_id: number;
  cic: string;
  device_type: string;
  document_complement?: string;
  document_extension?: string;
  document_number: string;
  document_type: string;
  email: string;
  home_address?: string;
  id: number;
  is_citizen_eeuu?: boolean;
  is_client?: boolean;
  is_married?: boolean;
  otp: string;
  pin: string;
  auth_token: string;
}

// ── 10. Login ────────────────────────────────────────────────────────────────
export interface LoginInput {
  application: string;
  certified_id: number;
  device_id: string;
  device_name: string;
  device_os: string;
  is_root?: boolean;
  mobile_number: string;
  notification_id?: string;
  pin: string;
  version?: string;
  auth_token: string;
}

export interface LoginData {
  private_token: string;
  mobile_number: string;
  time_session: number;
  name: string;
  last_name: string;
  second_last_name: string;
  document_number: string;
  document_extension: string;
  document_type: string;
  email: string;
  city: string;
  id: number;
  register_completed: boolean;
  is_client: boolean;
  number_show_form: number;
  business: string;
  RegisterShowForm: boolean;
}

// ── 11 & 12. Profile / Wallet ─────────────────────────────────────────────────
export interface ProfileParametersData {
  greeting: string;
  show_dialog: boolean;
}

export interface AccountInfo {
  number: string;
  currency: string;
  type: string;
}

export interface WalletCard {
  id: number;
  account: AccountInfo;
  balance: number;
  pan: string;
  expiration_date: string;
  code: string;
  image: string;
  enable: boolean;
}

export interface WalletAction {
  date: string;
  amount: number;
  currency: string;
  type: number;
  description: string;
  detail: string;
  destination_account: string;
  destination_account_name: string | null;
}

export interface WalletCardsData {
  wallet_cards: WalletCard[];
  actions: WalletAction[];
}

// ── DB entity ─────────────────────────────────────────────────────────────────
export interface DbUser {
  id: number;
  cellphone: string;
  email: string;
  document_number: string;
  document_type: string;
  document_extension: string;
  document_complement: string;
  cic: string;
  home_address: string;
  city?: string;
  is_client: boolean;
  is_married: boolean;
  is_citizen_eeuu: boolean;
  register_completed: boolean;
  cognito_sub: string;
  created_at: Date;
  updated_at: Date;
}

export interface DbDevice {
  id: number;
  device_id: string;
  device_type: string;
  certified_id: number;
  encrypted_device: string;
  user_id: number | null;
  created_at: Date;
}
