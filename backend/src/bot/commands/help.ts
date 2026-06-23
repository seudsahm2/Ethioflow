/**
 * /help Command Handler
 * 
 * Provides users with information about available commands and features.
 */

import { Context } from 'telegraf';

export const helpCommand = async (ctx: Context) => {
  const helpMessage = `
📚 *EthioFlow Help Guide*

*Available Commands:*

🏠 /start - Welcome message and quick start guide
🔍 /search <query> - Search for products
❓ /help - Show this help message

*How to Use Inline Search:*
Type \`@ethioflowerbot <search term>\` in any chat to search for products with images and full details.

*Examples:*
• \`@ethioflowerbot iPhone\`
• \`@ethioflowerbot laptop under 50000\`
• \`@ethioflowerbot headphones\`

*Features:*
✅ Real-time product search
✅ Detailed product information
✅ Price and condition filtering
✅ Image previews (inline mode)

Need more help? Contact support or visit our website.
  `.trim();

  await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
};
