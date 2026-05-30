import { Telegraf } from 'telegraf';

/**
 * 👨‍💻 TEAM MEMBER 2 (Seller Experience Engineer)
 * 
 * Implement background event handlers here.
 * 
 * Responsibilities:
 * - Listen to 'channel_post' to auto-sync inventory.
 * - Listen to 'my_chat_member' to handle seller onboarding.
 */

export const setupChannelHandlers = (bot: Telegraf) => {
  bot.on('channel_post', async (ctx) => {
    // TODO: Extract text/image, pass to AI parser, and save via productService
  });

  bot.on('my_chat_member', async (ctx) => {
    // TODO: Check if bot was made admin, then register channel via sellerService
  });
};
