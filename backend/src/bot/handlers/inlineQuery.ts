/**
 * Inline Query Handler
 * 
 * Handles inline queries when users type @ethioflowerbot <search_term> in any chat.
 * This allows buyers to search for products without opening the bot directly.
 */

import { Context } from 'telegraf';
import { InlineQueryResult } from 'telegraf/types';
import { searchProducts } from '../../core/services/productService';
import { enhanceSearchQuery } from '../../core/ai';

const formatPrice = (price: number): string => `${price.toLocaleString()} ETB`;

export const handleInlineQuery = async (ctx: Context) => {
  if (!ctx.inlineQuery) return;

  const query = ctx.inlineQuery.query.trim();

  try {
    let products: any[];

    if (!query) {
      // Empty query → return latest products WITHOUT calling AI (avoids errors)
      products = await searchProducts('');
    } else {
      // Non-empty → enhance with AI then search
      const enhancedQuery = await enhanceSearchQuery(query);
      products = await searchProducts(enhancedQuery);
    }

    // Telegram hard limit is 50 results total.
    // We use 1 slot for the summary card, so max 49 individual products.
    const MAX_INDIVIDUAL = 49;
    const individualProducts = products.slice(0, MAX_INDIVIDUAL);

    // ── NO RESULTS ──────────────────────────────────────────────────────────
    if (individualProducts.length === 0) {
      const noResult: InlineQueryResult = {
        type: 'article',
        id: 'no-results',
        title: query ? `No products found for "${query}"` : 'No products available yet',
        description: 'Try searching for: electronics, laptop, car, sofa, coffee...',
        input_message_content: {
          message_text: `🔍 No products found${query ? ` for *"${query}"*` : ''}.\n\nTry:\n• electronics\n• laptop\n• car\n• sofa`,
          parse_mode: 'Markdown',
        },
      };
      await ctx.answerInlineQuery([noResult], { cache_time: 10 });
      return;
    }

    // ── SUMMARY CARD (slot 0) ────────────────────────────────────────────────
    let summaryText = `🔍 *Search Results${query ? ` for "${query}"` : ' — Latest Products'}*\n\n`;
    individualProducts.slice(0, 5).forEach((p: any, i: number) => {
      summaryText += `${i + 1}. *${p.title}* — ${formatPrice(p.price)}\n`;
    });
    if (products.length > 5) summaryText += `_...and ${products.length - 5} more. Select below!_`;

    const summaryCard: InlineQueryResult = {
      type: 'article',
      id: 'summary',
      title: `📋 ${products.length} result${products.length > 1 ? 's' : ''} found${query ? ` for "${query}"` : ''}`,
      description: 'Tap to send a summary list to the chat',
      input_message_content: {
        message_text: summaryText,
        parse_mode: 'Markdown',
      },
    };

    // ── INDIVIDUAL PRODUCT CARDS ─────────────────────────────────────────────
    // Use 'article' type for ALL products (even those with images).
    // This ensures the description & price are visible in the preview pane
    // before the user sends. thumbnail_url shows the image as a small icon.

    // Only real HTTPS URLs are valid as thumbnail_url.
    // Telegram file_ids (stored when sellers post via channel) are NOT valid URLs.
    const isHttpUrl = (url: string | null | undefined): boolean =>
      !!url && (url.startsWith('http://') || url.startsWith('https://'));

    const productCards: InlineQueryResult[] = individualProducts.map((product: any) => {
      const trust = product.seller?.trustScore ? `🛡️ ${product.seller.trustScore}/10` : '';
      const messageText =
        `🛍️ *${product.title}*\n\n` +
        `💰 *Price:* ${formatPrice(product.price)}\n` +
        `📦 *Condition:* ${product.condition || 'Not specified'}\n` +
        `📂 *Category:* ${product.category || 'General'}\n` +
        (trust ? `${trust} Seller Trust Score\n` : '') +
        `\n📝 *Description:*\n${product.description || 'No description available.'}`;

      const description = `${formatPrice(product.price)} • ${product.condition || 'N/A'} • ${product.category || 'General'}${product.description ? '\n' + product.description.substring(0, 80) : ''}`;

      const startUrl = `https://t.me/${ctx.botInfo.username}?start=neg_${product.id}`;
      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '🤝 Negotiate with Seller', url: startUrl }
          ]
        ]
      };

      if (product.imageUrl) {
        if (isHttpUrl(product.imageUrl)) {
          // Public HTTPS URL (from seed data)
          return {
            type: 'photo',
            id: product.id,
            photo_url: product.imageUrl,
            thumbnail_url: product.imageUrl,
            title: product.title,
            description: description,
            caption: messageText,
            parse_mode: 'Markdown',
            reply_markup: replyMarkup,
          } as InlineQueryResult;
        } else {
          // Telegram file_id (from seller's channel post)
          return {
            type: 'photo',
            id: product.id,
            photo_file_id: product.imageUrl,
            title: product.title,
            description: description,
            caption: messageText,
            parse_mode: 'Markdown',
            reply_markup: replyMarkup,
          } as InlineQueryResult;
        }
      }

      // No image fallback (Text only)
      return {
        type: 'article',
        id: product.id,
        title: product.title,
        description: description,
        thumbnail_url: `https://picsum.photos/seed/${encodeURIComponent(product.title)}/80/80`,
        thumbnail_width: 80,
        thumbnail_height: 80,
        input_message_content: {
          message_text: messageText,
          parse_mode: 'Markdown',
          link_preview_options: { is_disabled: false },
        },
        reply_markup: replyMarkup,
      } as InlineQueryResult;
    });

    const finalResults: InlineQueryResult[] = [summaryCard, ...productCards];

    await ctx.answerInlineQuery(finalResults, {
      cache_time: query ? 60 : 10,
    });

  } catch (error) {
    console.error('Error handling inline query:', error);
    const errorCard: InlineQueryResult = {
      type: 'article',
      id: 'error',
      title: '❌ Search error — please try again',
      description: 'Something went wrong. Try typing again.',
      input_message_content: {
        message_text: '❌ An error occurred while searching. Please try again.',
      },
    };
    await ctx.answerInlineQuery([errorCard], { cache_time: 0 });
  }
};
