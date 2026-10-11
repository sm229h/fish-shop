import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

function resolveJwtSecret() {
  const raw = process.env.JWT_SECRET || '';
  if (raw.length >= 16) return raw;
  if (raw) {
    console.warn(
      '[config] JWT_SECRET is too short (<16 chars) and will be ignored — ' +
        'using an ephemeral secret. Sessions reset on restart.',
    );
  } else {
    console.warn(
      '[config] JWT_SECRET is not set — using an ephemeral secret. ' +
        'Set JWT_SECRET (min 16 chars) for stable logins.',
    );
  }
  return crypto.randomBytes(48).toString('hex');
}

export const env = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    // Vercel Postgres integration provides these automatically — prefer the
    // pooled connection string for serverless.
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    'postgres://daryapak:daryapak_dev_2024@localhost:5432/daryapak',
  JWT_SECRET: resolveJwtSecret(),
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};
