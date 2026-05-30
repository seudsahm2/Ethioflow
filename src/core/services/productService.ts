import { Product, ParsedProductData } from '../../types';

/**
 * 👩‍💻 TEAM MEMBER 1 (Core Data & AI Engineer)
 * 
 * Implement the ProductService here.
 * 
 * Responsibilities:
 * - createProduct(sellerId, parsedData)
 * - searchProducts(query)
 * - getProductById(id)
 */

export const createProduct = async (sellerId: string, data: ParsedProductData): Promise<Product> => {
  // TODO: Use Prisma to insert product into DB
  throw new Error("Not implemented yet");
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  // TODO: Use Prisma to search products by title or description
  return [];
};
