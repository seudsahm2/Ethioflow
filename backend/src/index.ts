/**
 * 🧑‍💻 TEAM MEMBER 3 (Buyer Experience & Bot Architect)
 * 
 * Main Bot Initialization
 * 
 * This file initializes the Telegraf bot and sets up all handlers,
 * middlewares, and commands for the buyer experience.
 */

import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { setupChannelHandlers } from './bot/handlers/channelPost';
import { handleInlineQuery } from './bot/handlers/inlineQuery';
import { startCommand, searchCommand, helpCommand } from './bot/commands';
import { loggerMiddleware, errorHandler } from './bot/middlewares';

// Validate environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Error: BOT_TOKEN is not set in environment variables.');
  console.error('Please create a .env file based on .env.example and add your bot token.');
  process.exit(1);
}

// Initialize the bot
const bot = new Telegraf(BOT_TOKEN);

console.log('🤖 Initializing EthioFlow Bot...');

// ============================================
// MIDDLEWARES
// ============================================

// Logger middleware - logs all incoming updates
bot.use(loggerMiddleware);

// ============================================
// BUYER COMMANDS & MENTIONS (Team Member 3)
// ============================================

bot.command('start', startCommand);
bot.command('search', searchCommand);
bot.command('help', helpCommand);

// Handle bot mentions in normal chat messages for searching
bot.on('text', async (ctx, next) => {
  const botUsername = ctx.botInfo?.username;
  if (botUsername) {
    const textLower = ctx.message.text.toLowerCase();
    const mentionLower = `@${botUsername.toLowerCase()}`;
    if (textLower.includes(mentionLower)) {
      return searchCommand(ctx);
    }
  }
  return next();
});

// Support Telegram 10.0 Guest Mode Updates
bot.use(async (ctx, next) => {
  const update = ctx.update as any;
  if (update.guest_message && update.guest_message.text) {
    const botUsername = ctx.botInfo?.username;
    if (botUsername) {
      const textLower = update.guest_message.text.toLowerCase();
      const mentionLower = `@${botUsername.toLowerCase()}`;
      if (textLower.includes(mentionLower)) {
        return searchCommand(ctx);
      }
    }
  }
  return next();
});

// ============================================
// INLINE QUERY HANDLER (Team Member 3)
// ============================================

bot.on('inline_query', handleInlineQuery);

// ============================================
// SELLER HANDLERS (Team Member 2)
// ============================================

// Initialize channel post handlers from TM2
setupChannelHandlers(bot);

// ============================================
// ERROR HANDLING
// ============================================

bot.catch(errorHandler);

// ============================================
// BOT LAUNCH
// ============================================

// Graceful shutdown handler
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await bot.stop(signal);
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

// Launch the bot
bot.launch({
  dropPendingUpdates: true, // Ignore updates received while bot was offline
})
  .then(() => {
    console.log('✅ EthioFlow Bot is running!');
    console.log('📱 Bot username:', bot.botInfo?.username);
    console.log('🔍 Users can search using: @' + bot.botInfo?.username + ' <search term>');
    console.log('\nPress Ctrl+C to stop the bot.');
  })
  .catch((error) => {
    console.error('❌ Failed to launch bot:', error);
    process.exit(1);
  });
