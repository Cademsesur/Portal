import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SESUR FLOW database…');

  const it = await prisma.department.upsert({
    where: { name: 'IT' },
    update: {},
    create: { name: 'IT', budgetCap: 50_000_000 },
  });
  const finance = await prisma.department.upsert({
    where: { name: 'Finance' },
    update: {},
    create: { name: 'Finance', budgetCap: 30_000_000 },
  });

  await prisma.user.upsert({
    where: { email: 'admin@sesur.bj' },
    update: {},
    create: {
      entraOid: 'seed-admin-oid',
      email: 'admin@sesur.bj',
      displayName: 'Admin SESUR',
      role: Role.SUPER_ADMIN,
      departmentId: it.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'daf@sesur.bj' },
    update: {},
    create: {
      entraOid: 'seed-daf-oid',
      email: 'daf@sesur.bj',
      displayName: 'DAF SESUR',
      role: Role.DAF,
      departmentId: finance.id,
    },
  });

  console.log('✅ Seed terminé');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
