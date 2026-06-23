import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Search products using full-text matching on title, description, and category.
 */
export const searchProducts = async (query: string, category?: string): Promise<any[]> => {
  const where: any = { isAvailable: true, isDraft: false };
  if (category && category !== 'All') {
    where.category = category;
  }

  const products = await prisma.product.findMany({
    where,
    include: { seller: true },
    take: 100,
    orderBy: { createdAt: 'desc' }
  });

  if (!query || query.trim() === '') return products;

  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  const fullQuery = query.toLowerCase().trim();

  const scored = products.map(product => {
    let score = 0;
    const title = product.title.toLowerCase();
    const desc = (product.description || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();

    const hasExactWord = (text: string, word: string) =>
      (` ${text} `).includes(` ${word} `);

    if (title === fullQuery) score += 500;
    else if (hasExactWord(title, fullQuery)) score += 200;
    else if (title.includes(fullQuery)) score += 100;
    else if (desc.includes(fullQuery)) score += 50;
    else if (cat.includes(fullQuery)) score += 30;

    searchTerms.forEach(term => {
      if (hasExactWord(title, term)) score += 20;
      else if (title.includes(term)) score += 10;
      if (desc.includes(term)) score += 5;
      if (cat.includes(term)) score += 5;
    });

    const trustBonus = (product.seller?.trustScore || 5) * 5;
    score += trustBonus;
    return { product, score, trustBonus };
  });

  return scored
    .filter(s => s.score > s.trustBonus)
    .sort((a, b) => b.score !== a.score ? b.score - a.score : a.product.price - b.product.price)
    .map(s => s.product);
};
