import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse } from '../types';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

// ─── Response helpers ─────────────────────────────────────────────────────────

export function ok<T>(data: T, message = 'OK'): APIGatewayProxyResult {
  const body: ApiResponse<T> = { state: 0, message, data };
  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

export function badRequest(message: string): APIGatewayProxyResult {
  const body: ApiResponse = { state: 1, message };
  return {
    statusCode: 400,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

export function serverError(message: string): APIGatewayProxyResult {
  const body: ApiResponse = { state: 99, message };
  return {
    statusCode: 500,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

function corsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ─── JWT helpers (internal device tokens) ────────────────────────────────────

export interface DeviceTokenPayload {
  deviceId: string;
  certifiedId: number;
}

export function signDeviceToken(payload: DeviceTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyDeviceToken(token: string): DeviceTokenPayload {
  return jwt.verify(token, JWT_SECRET) as DeviceTokenPayload;
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

export function parseBody<T>(event: APIGatewayProxyEvent): T {
  try {
    return JSON.parse(event.body ?? '{}') as T;
  } catch {
    return {} as T;
  }
}

/** Generates a fake encrypted key/iv pair for device identification responses */
export function generateDeviceCrypto(): { key: string; iv: string } {
  const toByteStr = (len: number): string =>
    Array.from({ length: len }, () => Math.floor(Math.random() * 256)).join('|');
  return { key: toByteStr(32), iv: toByteStr(16) };
}

export function generateTransactionResponse(code: string) {
  return {
    code,
    transaction_id: Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000,
    date: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
}

export function generateSessionId(): string {
  return `FR-SESSION-${Date.now()}-${uuidv4().replace(/-/g, '').slice(0, 12)}`;
}

/** Simple hash (NOT for production secrets — use bcrypt in a real system) */
export async function hashPin(pin: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(pin).digest('hex');
}
