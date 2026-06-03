/**
 * /search Command Handler
 * 
 * Allows users to search for products directly in the bot chat.
 */

import { Context } from 'telegraf';
import { searchProducts } from '../../core/services/productService';
import { enhanceSearchQuery } from '../../core/ai';

/**
 * Format price in Ethiopian Birr
 */
const formatPrice = (price: number): string => {
  return `${price.toLocaleString()} ETB`;
};

export const searchCommand = async (ctx: Context) => {
  // Support Telegram 10.0 Guest Mode: check for guest_message or standard message
  const updateObj = ctx.update as any;
  const msgObj = ctx.message || updateObj.guest_message;
  
  // Get the search query from the message text
  const messageText = msgObj && 'text' in msgObj ? msgObj.text : '';

  // ── Menu button trigger: "🔍 Search" (no actual query) ──────────────────
  if (messageText.trim() === '🔍 Search') {
    await ctx.reply(
      `🔍 *How to search EthioFlow:*\n\n` +
      `*Option 1 — Inline (best experience):*\n` +
      `Type \`@${ctx.botInfo?.username ?? 'ethioflowerbot'} <product>\` in *any* Telegram chat to see results with images.\n\n` +
      `*Option 2 — Here in bot chat:*\n` +
      `Type \`/search <product name>\`\n` +
      `Example: \`/search iPhone 13\`\n\n` +
      `💡 *Tip:* Inline search shows photos and a direct Negotiate button!`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Extract query by removing /search command and bot mention (if any)
  let query = messageText.replace('/search', '');
  if (ctx.botInfo?.username) {
    query = query.replace(new RegExp(`@${ctx.botInfo.username}`, 'gi'), '');
  }
  query = query.trim();

  // Enhance the query with AI (translate Amharic, extract core keywords)
  const enhancedQuery = await enhanceSearchQuery(query);

  // Helper to reply either via normal message or via new answerGuestQuery API
  // Helper to reply either via normal message or via new answerGuestQuery API
  const replyToUser = async (text: string) => {
    const guestQueryId = msgObj?.guest_query_id;
    if (guestQueryId) {
      // @ts-ignore: bypass strict Telegraf typings for new Telegram API methods
      await ctx.telegram.callApi('answerGuestQuery', {
        guest_query_id: guestQueryId,
        result: {
          type: 'article',
          id: `search_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: 'Search Results',
          input_message_content: {
            message_text: text,
            parse_mode: 'Markdown'
          }
        }
      });
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown' });
    }
  };

  if (!query) {
    await replyToUser(
      '🔍 *How to search:*\n\n' +
      'Use: `/search <product name>`\n\n' +
      '*Examples:*\n' +
      '• `/search iPhone`\n' +
      '• `/search laptop`\n' +
      '• `/search headphones`\n\n' +
      '💡 *Tip:* You can also use inline search by typing `@ethioflowerbot <search>` in any chat!'
    );
    return;
  }

  try {
    // Search for products using the enhanced query
    const products = await searchProducts(enhancedQuery);

    if (products.length === 0) {
      await replyToUser(
        `🔍 No products found for "${query}".\n\n` +
        'Try searching for:\n' +
        '• Electronics\n' +
        '• Phones\n' +
        '• Laptops\n' +
        '• Headphones'
      );
      return;
    }

    // Limit to top 3 results for direct message as requested
    const limitedProducts = products.slice(0, 3);

    // Create response message
    let responseMessage = `🔍 *Search Results for "${query}"*\n\n`;
    responseMessage += `Found ${products.length} product${products.length > 1 ? 's' : ''}`;
    
    if (products.length > 3) {
      responseMessage += ` (showing top 3)`;
    }
    
    responseMessage += ':\n\n';

    limitedProducts.forEach((product: any, index: number) => {
      responseMessage += `${index + 1}. *${product.title}*\n`;
      const trustScore = product.seller?.trustScore ? `${product.seller.trustScore}/10` : 'N/A';
      responseMessage += `   💰 ${formatPrice(product.price)} • 📦 ${product.condition} • 🛡️ Trust: ${trustScore}\n`;
      if (product.description) {
        const shortDesc = product.description.length > 80 
          ? product.description.substring(0, 80) + '...' 
          : product.description;
        responseMessage += `   📝 ${shortDesc}\n`;
      }
      responseMessage += '\n';
    });

    responseMessage += '💡 *Tip:* Use inline search (`@ethioflowerbot <search>`) to see images and full details!';

    await replyToUser(responseMessage);

  } catch (error) {
    console.error('Error in search command:', error);
    try {
      const guestQueryId = (ctx.message || (ctx.update as any).guest_message)?.guest_query_id;
      if (guestQueryId) {
        // @ts-ignore: bypass strict Telegraf typings
        await ctx.telegram.callApi('answerGuestQuery', {
          guest_query_id: guestQueryId,
          result: {
            type: 'article',
            id: `err_${Date.now()}`,
            title: 'Search Error',
            input_message_content: {
              message_text: '❌ An error occurred while searching. Please try again later.'
            }
          }
        });
      } else {
        await ctx.reply('❌ An error occurred while searching. Please try again later.');
      }
    } catch (e) {
      console.error('Failed to send error message:', e);
    }
  }
};
