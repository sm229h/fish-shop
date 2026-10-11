import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import migrate from './migrate.js';
import { errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import addressRoutes from './routes/addresses.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

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
