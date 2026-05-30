import { Telegraf } from 'telegraf';
import { setupChannelHandlers } from './bot/handlers/channelPost';

/**
 * 🧑‍💻 TEAM MEMBER 3 (Buyer Experience & Bot Architect)
 * 
 * Initialize the Telegraf Bot here.
 * 
 * Responsibilities:
 * - Create the bot instance.
 * - Set up middlewares (Session, Auth, Rate Limiting).
 * - Attach Buyer Commands (/start, /search, inline queries).
 * - Import and attach handlers from TM2.
 */

const bot = new Telegraf(process.env.BOT_TOKEN || 'MOCK_TOKEN');

// TODO: Middlewares
// bot.use(session());

// Initialize Handlers from TM2
setupChannelHandlers(bot);

// TODO: Buyer Commands
bot.command('start', (ctx) => {
  ctx.reply('Welcome to EthioFlow! Type @EthioFlowBot to search for products.');
});

bot.on('inline_query', async (ctx) => {
  // TODO: Use mock products from types, or call productService.searchProducts
});

// bot.launch();
