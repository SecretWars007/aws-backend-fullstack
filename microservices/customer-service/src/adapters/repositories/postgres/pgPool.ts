// ─── PostgreSQL Connection Pool ───────────────────────────────────────────────
// Shared pg Pool for the customer-service. Uses RDS Proxy in AWS (MOCK_MODE=false).

import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5433), // Localport 5433 maps to customer-db
      database: process.env.DB_NAME ?? 'customer_db',
      user: process.env.DB_USER ?? 'zappi',
      password: process.env.DB_PASS ?? 'zappipass',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });

    pool.on('error', (err) => {
      console.error('[PG Customer Pool Error]', err.message);
    });
  }
  return pool;
}
