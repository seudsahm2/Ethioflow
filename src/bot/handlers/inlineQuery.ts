/**
 * Inline Query Handler
 * 
 * Handles inline queries when users type @EthioFlowBot <search_term> in any chat.
 * This allows buyers to search for products without opening the bot directly.
 */

import { Context } from 'telegraf';
import { InlineQueryResult } from 'telegraf/types';
import { searchProducts } from '../../core/services/productService';

/**
 * Format price in Ethiopian Birr
 */
const formatPrice = (price: number): string => {
  return `${price.toLocaleString()} ETB`;
};

/**
 * Handle inline query events
 */
export const handleInlineQuery = async (ctx: Context) => {
  if (!ctx.inlineQuery) return;

  const query = ctx.inlineQuery.query.trim();
  
  try {
    // Search for products using the query from the database
    const products = await searchProducts(query);
    
    // Limit to top 50 results (Telegram's limit)
    const limitedProducts = products.slice(0, 50);
    
    // Create a summarized text of all products (like the /search command)
    let summaryMessage = `🔍 *Search Results for "${query}"*\n\n`;
    summaryMessage += `Found ${products.length} product${products.length > 1 ? 's' : ''}`;
    if (products.length > 10) {
      summaryMessage += ` (showing top 10)`;
    }
    summaryMessage += ':\n\n';

    products.slice(0, 10).forEach((product: any, index: number) => {
      summaryMessage += `${index + 1}. *${product.title}*\n`;
      summaryMessage += `   💰 ${formatPrice(product.price)} • 📦 ${product.condition || 'New'}\n`;
      if (product.description) {
        const shortDesc = product.description.length > 80 
          ? product.description.substring(0, 80) + '...' 
          : product.description;
        summaryMessage += `   📝 ${shortDesc}\n`;
      }
      summaryMessage += '\n';
    });
    summaryMessage += '💡 *Tip:* You can also share individual products by selecting them below!';

    // Create the "List all results" article as the first option
    const summaryResult: InlineQueryResult = {
      type: 'article',
      id: 'summary-list',
      title: `📋 Send Top 10 Results as a List`,
      description: `Send the search results exactly like the /search command`,
      input_message_content: {
        message_text: summaryMessage,
        parse_mode: 'Markdown',
      },
    };

    // Convert products to individual inline query results
    const productResults: InlineQueryResult[] = limitedProducts.map((product: any) => {
      // Create a detailed message with product information
      const messageText = `
🛍️ *${product.title}*

💰 *Price:* ${formatPrice(product.price)}
📦 *Condition:* ${product.condition || 'Not specified'}
📂 *Category:* ${product.category || 'General'}

📝 *Description:*
${product.description || 'No description available'}

✅ Available for purchase
      `.trim();

      // If product has an image, use photo result
      if (product.imageUrl) {
        return {
          type: 'photo',
          id: product.id,
          photo_url: product.imageUrl,
          thumbnail_url: product.imageUrl,
          title: product.title,
          description: `${formatPrice(product.price)} • ${product.condition}`,
          caption: messageText,
          parse_mode: 'Markdown',
        };
      }
      
      // Otherwise, use article result (text-based)
      return {
        type: 'article',
        id: product.id,
        title: product.title,
        description: `${formatPrice(product.price)} • ${product.condition}`,
        input_message_content: {
          message_text: messageText,
          parse_mode: 'Markdown',
        },
      };
    });

    // Combine the summary result at the top, followed by individual products
    const finalResults: InlineQueryResult[] = [summaryResult, ...productResults];

    // If no results found, show a helpful message
    if (productResults.length === 0) {
      const noResultsMessage: InlineQueryResult = {
        type: 'article',
        id: 'no-results',
        title: 'No products found',
        description: query ? `No results for "${query}"` : 'Try searching for electronics, phones, laptops, etc.',
        input_message_content: {
          message_text: `🔍 No products found${query ? ` for "${query}"` : ''}.\n\nTry searching for:\n• Electronics\n• Phones\n• Laptops\n• Headphones`,
        },
      };
      
      await ctx.answerInlineQuery([noResultsMessage], {
        cache_time: 30,
      });
      return;
    }

    // Answer the inline query with results
    await ctx.answerInlineQuery(finalResults, {
      cache_time: 60, // Cache results for 60 seconds
    });
    
  } catch (error) {
    console.error('Error handling inline query:', error);
    
    // Send error message as inline result
    const errorResult: InlineQueryResult = {
      type: 'article',
      id: 'error',
      title: 'Error occurred',
      description: 'Unable to search products at this time',
      input_message_content: {
        message_text: '❌ An error occurred while searching. Please try again later.',
      },
    };
    
    await ctx.answerInlineQuery([errorResult], {
      cache_time: 0,
    });
  }
};
