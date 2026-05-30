import { Telegraf } from 'telegraf';
import { config } from './config';
import { startCommand } from './bot/commands/start';
import { helpCommand } from './bot/commands/help';
import { handleChannelPost } from './bot/handlers/channelPost';
import { handleForwards } from './bot/handlers/forwards';

const bot = new Telegraf(config.BOT_TOKEN);

// Commands
bot.start(startCommand);
bot.help(helpCommand);

// Handlers
bot.on('channel_post', handleChannelPost);
bot.on('forward_date', handleForwards);

bot.launch().then(() => {
  console.log('EthioFlow Bot is running...');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
