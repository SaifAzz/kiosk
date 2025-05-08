import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.country.deleteMany();

  // Create countries
  const iraq = await prisma.country.create({
    data: {
      name: 'Iraq',
      pettyCash: 1000
    }
  });

  const syria = await prisma.country.create({
    data: {
      name: 'Syria',
      pettyCash: 1000
    }
  });

  // Create admin users
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.admin.create({
    data: {
      username: 'admin_iraq',
      password: hashedPassword,
      countryId: iraq.id
    }
  });

  await prisma.admin.create({
    data: {
      username: 'admin_syria',
      password: hashedPassword,
      countryId: syria.id
    }
  });

  // Create regular users
  const userPassword = await bcrypt.hash('user123', 10);

  const iraqUser1 = await prisma.user.create({
    data: {
      phoneNumber: '+9641234567890',
      password: userPassword,
      countryId: iraq.id
    }
  });

  const iraqUser2 = await prisma.user.create({
    data: {
      phoneNumber: '+9641234567891',
      password: userPassword,
      countryId: iraq.id
    }
  });

  const syriaUser1 = await prisma.user.create({
    data: {
      phoneNumber: '+9631234567890',
      password: userPassword,
      countryId: syria.id
    }
  });

  const syriaUser2 = await prisma.user.create({
    data: {
      phoneNumber: '+9631234567891',
      password: userPassword,
      countryId: syria.id
    }
  });

  console.log('Base seed data inserted successfully');
  console.log('Run seedProducts.ts to populate products');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 