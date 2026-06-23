import { Telegraf, Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function setupBusinessConnectionHandler(bot: Telegraf<Context>) {
  // Telegraf v4 doesn't have Business API typedefs yet — handle via raw update middleware
  bot.use(async (ctx, next) => {
    const update = ctx.update as any;
    if (!update.business_connection) return next();

    const conn = update.business_connection;
    const telegramId: number = conn.user.id;
    const isEnabled: boolean = conn.is_enabled;

    // ✅ COMPLIANCE: Check can_reply field so we don't attempt to send when the
    // user has granted "read-only" access to their DMs (no reply permission).
    const canReply: boolean = conn.can_reply !== false; // default true if not present

    console.log(`💼 Business Connection: User ${telegramId} | Active: ${isEnabled} | Can Reply: ${canReply}`);

    try {
      await prisma.user.upsert({
        where: { telegramId: BigInt(telegramId) },
        update: {
          businessConnectionId: isEnabled ? conn.id : null,
          canReply: isEnabled ? canReply : false,
          username: conn.user.username || undefined,
          firstName: conn.user.first_name || undefined
        },
        create: {
          telegramId: BigInt(telegramId),
          username: conn.user.username || null,
          firstName: conn.user.first_name || null,
          businessConnectionId: isEnabled ? conn.id : null,
          canReply: isEnabled ? canReply : false
        }
      });

      console.log(`✅ Connection ${isEnabled ? 'saved' : 'cleared'} for user ${telegramId}. canReply=${canReply}`);

      // ✅ COMPLIANCE: Welcome message when user first connects (using user_chat_id from connection object)
      if (isEnabled && conn.user_chat_id) {
        await bot.telegram.sendMessage(
          conn.user_chat_id.toString(),
          `🤝 *Secretary Mode Connected!*\n\n` +
          `EthioFlow is now your AI negotiation secretary. ` +
          `When a buyer initiates negotiation, I'll handle the back-and-forth on your behalf.\n\n` +
          `${canReply ? '✅ Reply permissions: Active' : '⚠️ Read-only mode: I can monitor but not reply. Enable reply permissions in Settings → Telegram Business → Chatbots.'}`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to update business connection:', err);
    }
  });
}
