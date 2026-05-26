/**
 * /search Command Handler
 * 
 * Allows users to search for products directly in the bot chat.
 */

import { Context } from 'telegraf';
import { searchProducts } from '../mockData';

/**
 * Format price in Ethiopian Birr
 */
const formatPrice = (price: number): string => {
  return `${price.toLocaleString()} ETB`;
};

export const searchCommand = async (ctx: Context) => {
  // Get the search query from the message text
  const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const query = messageText.replace('/search', '').trim();

  if (!query) {
    await ctx.reply(
      '🔍 *How to search:*\n\n' +
      'Use: `/search <product name>`\n\n' +
      '*Examples:*\n' +
      '• `/search iPhone`\n' +
      '• `/search laptop`\n' +
      '• `/search headphones`\n\n' +
      '💡 *Tip:* You can also use inline search by typing `@EthioFlowBot <search>` in any chat!',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  try {
    // Search for products
    const products = await searchProducts(query);

    if (products.length === 0) {
      await ctx.reply(
        `🔍 No products found for "${query}".\n\n` +
        'Try searching for:\n' +
        '• Electronics\n' +
        '• Phones\n' +
        '• Laptops\n' +
        '• Headphones'
      );
      return;
    }

    // Limit to top 10 results for direct message
    const limitedProducts = products.slice(0, 10);

    // Create response message
    let responseMessage = `🔍 *Search Results for "${query}"*\n\n`;
    responseMessage += `Found ${products.length} product${products.length > 1 ? 's' : ''}`;
    
    if (products.length > 10) {
      responseMessage += ` (showing top 10)`;
    }
    
    responseMessage += ':\n\n';

    limitedProducts.forEach((product, index) => {
      responseMessage += `${index + 1}. *${product.title}*\n`;
      responseMessage += `   💰 ${formatPrice(product.price)} • 📦 ${product.condition}\n`;
      if (product.description) {
        const shortDesc = product.description.length > 80 
          ? product.description.substring(0, 80) + '...' 
          : product.description;
        responseMessage += `   📝 ${shortDesc}\n`;
      }
      responseMessage += '\n';
    });

    responseMessage += '💡 *Tip:* Use inline search (`@EthioFlowBot <search>`) to see images and full details!';

    await ctx.reply(responseMessage, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error in search command:', error);
    await ctx.reply('❌ An error occurred while searching. Please try again later.');
  }
};
