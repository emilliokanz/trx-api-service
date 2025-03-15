import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productPrices = [
    {
      brand: 'Telkomsel',
      category: 'pulsa',
      price: 4500,
      buyer_sku_code: 'vip-5k',
      product_name: '',
    },
    {
      brand: 'Telkomsel',
      category: 'pulsa',
      price: 9000,
      buyer_sku_code: 'vip-10k',
      product_name: '',
    },
    {
      brand: 'Telkomsel',
      category: 'pulsa',
      price: 27000,
      buyer_sku_code: 'vip-30k',
      product_name: '',
    },
    {
      brand: 'Telkomsel',
      category: 'pulsa',
      price: 54000,
      buyer_sku_code: 'vip-60k',
      product_name: '',
    },
    {
      brand: 'Telkomsel',
      category: 'pulsa',
      price: 225000,
      buyer_sku_code: 'vip-250k',
      product_name: '',
    },
    {
      brand: 'Telkomsel',
      category: 'pulsa',
      price: 450000,
      buyer_sku_code: 'vip-500k',
      product_name: '',
    },
    {
      brand: 'MOBILE LEGEND',
      category: 'GAMES',
      price: 1200,
      buyer_sku_code: 'ml3',
      product_name: '',
    },
  ];

  for (const productPrice of productPrices) {
    await prisma.productPrice.create({
      data: productPrice,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
