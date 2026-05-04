import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types/auth.types';

export function generateToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
