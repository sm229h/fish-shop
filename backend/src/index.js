import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { createApp } from './app.js';
import migrate from './migrate.js';

const app = createApp();

async function start() {
  await migrate();
  // Auto-seed in development if no admin exists
  if (env.NODE_ENV === 'development') {
    const { rows } = await pool.query("SELECT 1 FROM users WHERE role IN ('admin','super_admin') LIMIT 1");
    if (rows.length === 0) {
      console.log('[seed] No admin found, running seed...');
      const { default: runSeed } = await import('./seed.js');
      await runSeed();
    }
  }
  app.listen(env.PORT, () => {
    console.log(`[server] Running on port ${env.PORT}`);
  });
}

start().catch(err => {
  console.error('[startup] Failed:', err);
  process.exit(1);
});
