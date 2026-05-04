import { USER_ROLE } from '@prisma/client';
import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';
import { hashPassword } from '../src/utils/password';

async function seedSuperAdmin(): Promise<void> {
  if (!env.superAdminEmail || !env.superAdminPassword) {
    console.log('SUPER_ADMIN seed skipped: SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD is not configured.');
    return;
  }

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: USER_ROLE.SUPER_ADMIN },
  });

  if (existingSuperAdmin) {
    console.log(`SUPER_ADMIN already exists for ${existingSuperAdmin.email}.`);
    return;
  }

  const existingEmailUser = await prisma.user.findUnique({
    where: { email: env.superAdminEmail.toLowerCase() },
  });

  if (existingEmailUser) {
    await prisma.user.update({
      where: { id: existingEmailUser.id },
      data: {
        name: env.superAdminName,
        password: await hashPassword(env.superAdminPassword),
        role: USER_ROLE.SUPER_ADMIN,
      },
    });

    console.log(`Existing user promoted to SUPER_ADMIN: ${env.superAdminEmail}`);
    return;
  }

  await prisma.user.create({
    data: {
      name: env.superAdminName,
      email: env.superAdminEmail.toLowerCase(),
      password: await hashPassword(env.superAdminPassword),
      role: USER_ROLE.SUPER_ADMIN,
    },
  });

  console.log(`SUPER_ADMIN created: ${env.superAdminEmail}`);
}

seedSuperAdmin()
  .catch((error: unknown) => {
    console.error('SUPER_ADMIN seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
