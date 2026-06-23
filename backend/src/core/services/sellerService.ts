import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SellerService {
  static async registerSeller(telegramId: bigint | number, channelId: bigint | number, channelName: string) {
    // Ensure the user exists
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: {},
      create: { telegramId: BigInt(telegramId) }
    });

    // Upsert the seller
    return prisma.seller.upsert({
      where: { channelId: BigInt(channelId) },
      update: { channelName, userId: user.id },
      create: { channelId: BigInt(channelId), channelName, userId: user.id }
    });
  }
}
