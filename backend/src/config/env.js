import dotenv from 'dotenv';
dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://daryapak:daryapak_dev_2024@localhost:5432/daryapak',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_fallback',
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};
