import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const owners = [
    {
      name: 'Arvin',
      balance: 0,
    },
    {
      name: 'Vidi',
      balance: 0,
    },
    {
      name: 'Emil',
      balance: 0,
    },
  ];

  for (const owner of owners) {
    await prisma.owner.create({
      data: owner,
    });
  }

  console.log('Seeding OWNER completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding OWNER:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
