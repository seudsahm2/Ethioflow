import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductService {
  static async createProduct(data: any) {
    return prisma.product.create({ data });
  }

  static async searchProducts(query: string) {
    return prisma.product.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' }
      }
    });
  }
}
