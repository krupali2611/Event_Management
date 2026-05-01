import dotenv from 'dotenv';
import type { EnvConfig } from '../types/env';

dotenv.config();

function getRequiredEnv(name: 'DATABASE_URL' | 'JWT_SECRET'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env: EnvConfig = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: getRequiredEnv('DATABASE_URL'),
  jwtSecret: getRequiredEnv('JWT_SECRET'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
