import { Pool, PoolClient, QueryResultRow } from 'pg';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

let pool: Pool | null = null;

interface DbCredentials {
  host: string;
  port: number;
  dbname: string;
  username: string;
  password: string;
}

/**
 * Retrieves DB credentials from AWS Secrets Manager or local env vars.
 */
async function getCredentials(): Promise<DbCredentials> {
  const secretArn = process.env.DB_SECRET_ARN;

  if (secretArn) {
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
    });
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretArn }),
    );
    return JSON.parse(response.SecretString!) as DbCredentials;
  }

  // Fallback for local development
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    dbname: process.env.DB_NAME ?? 'zappi',
    username: process.env.DB_USER ?? 'zappiuser',
    password: process.env.DB_PASSWORD ?? 'changeme',
  };
}

/**
 * Returns a singleton connection pool. Reused across Lambda warm invocations.
 */
export async function getPool(): Promise<Pool> {
  if (pool) return pool;

  const creds = await getCredentials();

  pool = new Pool({
    host: creds.host,
    port: creds.port,
    database: creds.dbname,
    user: creds.username,
    password: creds.password,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pool.on('error', (err) => {
    console.error('[DB] Pool error', err);
    pool = null; // force re-init on next call
  });

  return pool;
}


/**
 * Executes a query using a checked-out client and releases it automatically.
 */
export async function query<T extends QueryResultRow = any>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const p = await getPool();
  const client: PoolClient = await p.connect();
  try {
    const result = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Executes a block of SQL in a transaction.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const p = await getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
