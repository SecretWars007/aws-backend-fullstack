// ─── PostgreSQL Connection Pool ───────────────────────────────────────────────
// Shared pg Pool for the wallet-service. Uses RDS Proxy in AWS (MOCK_MODE=false).

import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5434), // Localport 5434 maps to wallet-db
      database: process.env.DB_NAME ?? 'wallet_db',
      user: process.env.DB_USER ?? 'zappi',
      password: process.env.DB_PASS ?? 'zappipass',
      max: 15, // Higher connection count for transactional service
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });

    pool.on('error', (err) => {
      console.error('[PG Wallet Pool Error]', err.message);
    });
  }
  return pool;
}
