import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Create a User
  const user = await prisma.user.upsert({
    where: { telegramId: 123456789n },
    update: {},
    create: {
      telegramId: 123456789n,
      username: 'test_seller',
      firstName: 'Test',
    },
  });
  console.log(`Created user: ${user.username}`);

  // 2. Create a Seller profile for the user
  const seller = await prisma.seller.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      channelId: -100123456789n,
      channelName: 'Ethio Electronics',
      trustScore: 8,
      brandVoiceRules: 'Friendly, always mention warranty.',
    },
  });
  console.log(`Created seller: ${seller.channelName}`);

  // 3. Create Products for the seller
  const products = [
    {
      title: 'Samsung Galaxy S23',
      description: 'Brand new, 256GB, Black',
      price: 65000,
      condition: 'New',
      category: 'Electronics',
      sellerId: seller.id,
    },
    {
      title: 'MacBook Pro M2',
      description: 'Used for 6 months, excellent condition',
      price: 120000,
      condition: 'Used',
      category: 'Computers',
      sellerId: seller.id,
    },
    {
      title: 'Gas Stove 4 Burner',
      description: 'Stainless steel, auto ignition',
      price: 8500,
      condition: 'New',
      category: 'Home Appliances',
      sellerId: seller.id,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.create({
      data: p,
    });
    console.log(`Created product: ${product.title}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
