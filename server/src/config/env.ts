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
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
  superAdminName: process.env.SUPER_ADMIN_NAME ?? 'System Super Admin',
};
