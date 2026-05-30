import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SellerService {
  static async registerSeller(telegramId: string, channelId: string, name: string) {
    return prisma.seller.upsert({
      where: { telegramId },
      update: { channelId, name },
      create: { telegramId, channelId, name }
    });
  }
}
