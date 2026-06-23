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

export const createProduct = async (sellerId: string, data: ParsedProductData & { telegramFileIds?: string[], messageId?: bigint, mediaGroupId?: string }): Promise<Product> => {
  const isFixed = data.isFixedPrice ?? false;
  const product = await prisma.product.create({
    data: {
      sellerId,
      title: data.title,
      description: data.description,
      price: data.price,
      // For fixed price items, minPrice = price (floor equals ceiling — no discount possible)
      minPrice: isFixed ? data.price : (data.minPrice ?? 0),
      isFixedPrice: isFixed,
      condition: data.condition,
      category: data.category,
      telegramFileIds: data.telegramFileIds || [],
      messageId: data.messageId,
      mediaGroupId: data.mediaGroupId,
      isDraft: data.isDraft || false,
      missingFields: data.missingFields || null
    }
  });
  
  return product as unknown as Product;
};

export const searchProducts = async (query: string): Promise<any[]> => {
  if (!query || query.trim() === '') {
    const products = await prisma.product.findMany({
      where: { isAvailable: true, isDraft: false },
      include: { seller: true },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    return products;
  }

  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  
  // Fetch recent products with their seller data
  const products = await prisma.product.findMany({
    where: { isAvailable: true, isDraft: false },
    include: { seller: true },
    take: 1000, 
    orderBy: { createdAt: 'desc' }
  });

  // Score and sort products in memory
  const scoredProducts = products.map(product => {
    let score = 0;
    const title = product.title.toLowerCase();
    const desc = (product.description || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();
    const fullQuery = query.toLowerCase().trim();

    const hasExactWord = (text: string, word: string) => 
      (` ${text} `).includes(` ${word} `);

    // Relevance Score
    if (title === fullQuery) score += 500;
    else if (hasExactWord(title, fullQuery)) score += 200;
    else if (title.includes(fullQuery)) score += 100;
    else if (desc.includes(fullQuery)) score += 50;
    else if (cat.includes(fullQuery)) score += 50;

    searchTerms.forEach(term => {
      if (hasExactWord(title, term)) score += 20;
      else if (title.includes(term)) score += 10;
      if (hasExactWord(desc, term)) score += 10;
      else if (desc.includes(term)) score += 5;
      if (hasExactWord(cat, term)) score += 10;
      else if (cat.includes(term)) score += 5;
    });

    // Trust Score factor (higher trust gives a bonus)
    const trustBonus = (product.seller?.trustScore || 5) * 5; 
    score += trustBonus;

    return { product, score };
  });

  // Filter out products with no relevance (score < trustBonus alone)
  const matchedProducts = scoredProducts.filter(sp => sp.score > (sp.product.seller?.trustScore || 5) * 5);
  
  // Sort by: 1) Score (desc), 2) Price (asc - cheaper is better)
  matchedProducts.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.product.price - b.product.price;
  });
  
  return matchedProducts.map(sp => sp.product);
};
