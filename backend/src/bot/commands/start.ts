/**
 * /start Command Handler
 * 
 * Welcomes new users and provides instructions on how to use the bot.
 */

import { Context } from 'telegraf';

export const startCommand = async (ctx: Context) => {
  const welcomeMessage = `
🎉 *Welcome to EthioFlow!*

The unified marketplace connecting Ethiopian buyers and sellers.

🔍 *How to Search for Products:*
• Type \`@EthioFlowBot <search term>\` in any chat
• Or use the /search command here

💡 *Examples:*
• \`@EthioFlowBot iPhone\`
• \`@EthioFlowBot laptop\`
• \`@EthioFlowBot headphones\`

📱 Start searching now and find great deals!
  `.trim();

  await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
};
