import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS, ROLE_DEFINITIONS } from '../src/lib/permissions';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@akademiroyal.com';
const ADMIN_PASSWORD = 'AkademiRoyal2026!';

const EXPENSE_CATEGORIES = [
  'Yemek',
  'Eğitim Malzemeleri',
  'Kira',
  'Elektrik',
  'Su',
  'İnternet',
  'Reklam',
  'Personel',
  'Ulaşım',
  'Temizlik',
  'Diğer',
];

async function main() {
  console.log('Yetkiler oluşturuluyor...');
  for (const p of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { module: p.module, action: p.action },
      create: { code: p.code, module: p.module, action: p.action },
    });
  }

  console.log('Roller oluşturuluyor...');
  for (const roleDef of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: { name: roleDef.name, description: roleDef.description, isSystem: true },
    });

    // Rolün mevcut izinlerini temizleyip tanıma göre yeniden kur (idempotent seed).
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const permissions = await prisma.permission.findMany({ where: { code: { in: roleDef.permissions } } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }

  console.log('Yönetici kullanıcısı oluşturuluyor...');
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Süper Yönetici' } });
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: 'Sistem Yöneticisi',
      email: ADMIN_EMAIL,
      passwordHash,
      roleId: superAdminRole.id,
    },
  });

  console.log('Finansal hesaplar oluşturuluyor...');
  await prisma.financialAccount.upsert({
    where: { id: 'seed-ana-kasa' },
    update: {},
    create: { id: 'seed-ana-kasa', name: 'Ana Kasa', type: 'CASH' },
  });
  await prisma.financialAccount.upsert({
    where: { id: 'seed-ana-banka' },
    update: {},
    create: { id: 'seed-ana-banka', name: 'Ana Banka Hesabı', type: 'BANK' },
  });
  await prisma.financialAccount.upsert({
    where: { id: 'seed-pos' },
    update: {},
    create: { id: 'seed-pos', name: 'POS', type: 'POS' },
  });

  console.log('Masraf kategorileri oluşturuluyor...');
  for (const name of EXPENSE_CATEGORIES) {
    await prisma.expenseCategory.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('Kurum ayarları oluşturuluyor...');
  await prisma.systemSetting.upsert({
    where: { key: 'org' },
    update: {},
    create: {
      key: 'org',
      value: { name: 'Akademi Royal', subtitle: 'Academy of Beauty', branch: 'Bakırköy' },
    },
  });

  console.log('\nSeed tamamlandı.');
  console.log(`İlk giriş: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
