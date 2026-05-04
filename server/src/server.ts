import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { USER_ROLE } from '@prisma/client';
import { hashPassword } from './utils/password';

async function ensureSuperAdmin(): Promise<void> {
  if (!env.superAdminEmail || !env.superAdminPassword) {
    return;
  }

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: USER_ROLE.SUPER_ADMIN },
  });

  if (existingSuperAdmin) {
    return;
  }

  const normalizedEmail = env.superAdminEmail.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: env.superAdminName,
        password: await hashPassword(env.superAdminPassword),
        role: USER_ROLE.SUPER_ADMIN,
      },
    });
    return;
  }

  await prisma.user.create({
    data: {
      name: env.superAdminName,
      email: normalizedEmail,
      password: await hashPassword(env.superAdminPassword),
      role: USER_ROLE.SUPER_ADMIN,
    },
  });
}

void ensureSuperAdmin()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });
  })
  .catch((error: unknown) => {
    console.error('Failed to initialize SUPER_ADMIN user', error);
    process.exit(1);
  });
