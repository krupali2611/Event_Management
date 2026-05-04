import { z } from 'zod';
import { USER_ROLE } from '@prisma/client';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    email: z.email('Please provide a valid email address').transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRule,
        'Password must include uppercase, lowercase, number, and special character',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.email('Please provide a valid email address').transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(USER_ROLE),
});
