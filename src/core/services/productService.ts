import { Product, ParsedProductData } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  const product = await prisma.product.create({
    data: {
      sellerId,
      title: data.title,
      description: data.description,
      price: data.price,
      condition: data.condition,
      category: data.category,
    }
  });
  
  // Convert BigInt to string for the return type if necessary, or just return as is if types match
  return product as unknown as Product;
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  if (!query || query.trim() === '') {
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    return products as unknown as Product[];
  }

  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  
  // To avoid Prisma provider conflicts with case-insensitivity (like 'mode' not supported in SQLite),
  // we fetch recent available products and do the tolerant filtering & scoring in memory.
  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    take: 1000, // Fetch recent products
    orderBy: { createdAt: 'desc' }
  });

  // Score and sort products in memory to prioritize exact/full matches
  const scoredProducts = products.map(product => {
    let score = 0;
    const title = product.title.toLowerCase();
    const desc = (product.description || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();
    const fullQuery = query.toLowerCase().trim();

    // Helper to check exact word match safely
    const hasExactWord = (text: string, word: string) => 
      (` ${text} `).includes(` ${word} `);

    // Highest priority: Exact title match
    if (title === fullQuery) score += 500;
    // High priority: Exact word match of the full phrase
    else if (hasExactWord(title, fullQuery)) score += 200;
    // Medium priority: Phrase is somewhere in the title (substring)
    else if (title.includes(fullQuery)) score += 100;
    else if (desc.includes(fullQuery)) score += 50;
    else if (cat.includes(fullQuery)) score += 50;

    // Lower priority: Individual word/partial matches
    searchTerms.forEach(term => {
      if (hasExactWord(title, term)) score += 20;
      else if (title.includes(term)) score += 10;
      
      if (hasExactWord(desc, term)) score += 10;
      else if (desc.includes(term)) score += 5;
      
      if (hasExactWord(cat, term)) score += 10;
      else if (cat.includes(term)) score += 5;
    });

    return { product, score };
  });

  // Filter out products with 0 score (no matches), sort by score, take top 50
  const matchedProducts = scoredProducts.filter(sp => sp.score > 0);
  matchedProducts.sort((a, b) => b.score - a.score);
  
  return matchedProducts.slice(0, 50).map(sp => sp.product) as unknown as Product[];
};
