import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  // NOTE: node-postgres lets query-string SSL params (e.g. `?sslmode=require`,
  // which Neon/Vercel Postgres URLs include) overwrite the `ssl` option below,
  // and `require` verifies the chain by default — managed poolers present
  // self-signed chains, hence «self-signed certificate in certificate chain».
  // We strip those params and set `ssl` explicitly instead.
  connectionString: sanitizeConnectionString(env.DATABASE_URL),
  // Serverless instances each hold their own pool — keep it small on Vercel
  // so concurrent instances can't exhaust the managed database.
  max: toInt(process.env.PG_POOL_MAX, process.env.VERCEL ? 3 : 10),
  idleTimeoutMillis: 30_000,
  // Fail fast instead of hanging a serverless invocation on a dead database.
  connectionTimeoutMillis: 8_000,
  // Managed Postgres (Neon / Vercel Postgres / Supabase pooler) terminates TLS
  // with certificates Node can't verify (self-signed chain). Local docker PG
  // has no TLS at all, so only enable SSL for remote hosts. Set
  // PG_SSL_VERIFY=1 to force strict verification.
  ...(isRemoteDatabase(env.DATABASE_URL)
    ? { ssl: { rejectUnauthorized: process.env.PG_SSL_VERIFY === '1' } }
    : {}),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

function toInt(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isRemoteDatabase(connectionString = '') {
  try {
    const { hostname } = new URL(connectionString);
    return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1';
  } catch {
    return false;
  }
}

function sanitizeConnectionString(connectionString = '') {
  try {
    const url = new URL(connectionString);
    for (const param of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'sslnegotiation']) {
      url.searchParams.delete(param);
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}
