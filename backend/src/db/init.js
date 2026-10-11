import { env } from '../config/env.js';
import migrate from '../migrate.js';
import { pool } from './pool.js';

/**
 * Zero-config boot for single-service deploys (Vercel, single Docker image).
 *
 * The first request applies pending migrations and, when the database is
 * completely fresh (no admin user yet), seeds the sample catalogue + admin
 * account. The result is cached globally so warm serverless instances pay this
 * cost exactly once. Seeding only fills empty tables, so it can never wipe
 * real data.
 */
let ready = null;

export function ensureDatabaseReady() {
  if (!ready) {
    ready = (async () => {
      await migrate();
      const { rows } = await pool.query(
        "SELECT 1 FROM users WHERE role IN ('admin','super_admin') LIMIT 1",
      );
      if (rows.length === 0) {
        console.log('[db] fresh database detected — seeding sample data…');
        const { default: runSeed } = await import('../seed.js');
        await runSeed();
        console.log('[db] seed complete.');
      }
      return true;
    })().catch((error) => {
      // Allow the next request to retry instead of caching the failure.
      ready = null;
      if (env.DATABASE_URL.includes('localhost')) {
        console.error(
          '[db] cannot reach Postgres and no DATABASE_URL is configured. ' +
            'On Vercel, add a Postgres database (Storage → Create Database) ' +
            'so DATABASE_URL/POSTGRES_URL is provided automatically.',
        );
      }
      throw error;
    });
  }
  return ready;
}
