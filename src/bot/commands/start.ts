import { Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_KEYBOARD = {
  keyboard: [['📦 Post a Product', '🔍 Search']],
  resize_keyboard: true,
  persistent: true,
};

export const startCommand = async (ctx: Context) => {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: {
        username: ctx.from.username || null,
        firstName: ctx.from.first_name || null
      },
      create: {
        telegramId: BigInt(telegramId),
        username: ctx.from.username || null,
        firstName: ctx.from.first_name || null
      }
    }).catch(e => console.warn('Upsert user on start failed:', e));
  }

  const text = (ctx.message as any)?.text || '';
  const payload = text.split(' ')[1] || '';

  // ── Deep link: start negotiation ────────────────────────────────────────
  if (payload.startsWith('neg_')) {
    const productId = payload.replace('neg_', '');

    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { seller: { include: { user: true } } }
      });

      if (!product) {
        await ctx.reply('❌ Product not found or has been removed.');
        return;
      }

      const buyerTelegramId = ctx.from?.id;
      if (!buyerTelegramId) return;

      const sellerTelegramId = product.seller.user.telegramId;

      if (buyerTelegramId === Number(sellerTelegramId)) {
        await ctx.reply('❌ You cannot negotiate with yourself!');
        return;
      }

      // Check if buyer has connected their business profile
      const buyerUser = await prisma.user.findUnique({
        where: { telegramId: BigInt(buyerTelegramId) }
      });

      if (!buyerUser || !buyerUser.businessConnectionId) {
        await ctx.reply(
          `⚠️ *Profile Link Required!*\n\n` +
          `To use Secretary Mode (Autonomous AI Negotiation), you must first connect this bot to your Telegram Business profile.\n\n` +
          `Go to *Settings > Telegram Business > Chatbots* in your Telegram app and add this bot. Once connected, try clicking the negotiate button again!`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Check if seller has connected their business profile
      const sellerUser = product.seller.user;
      if (!sellerUser.businessConnectionId) {
        await ctx.reply(
          `⚠️ *Seller Profile Disconnected!*\n\n` +
          `The seller has not connected their Secretary profile. Negotiation cannot start until the seller activates Secretary Mode. Please check back later!`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Deactivate any other active or budget-awaiting negotiations
      await prisma.negotiation.updateMany({
        where: {
          buyerId: BigInt(buyerTelegramId),
          sellerId: sellerTelegramId,
          status: { in: ['ACTIVE', 'AWAITING_BUDGET'] }
        },
        data: { status: 'FAILED' }
      });

      // Create a negotiation record AWAITING_BUDGET
      await prisma.negotiation.create({
        data: {
          buyerId: BigInt(buyerTelegramId),
          sellerId: sellerTelegramId,
          productId: product.id,
          buyerMax: 0,
          status: product.isFixedPrice ? 'ACTIVE' : 'AWAITING_BUDGET',
          lastSender: 'SELLER'
        }
      });

      if (product.isFixedPrice) {
        // Fixed price: no budget needed — jump straight into terms negotiation
        await ctx.reply(
          `🔒 *Fixed Price Product*\n\n` +
          `*${product.title}* is listed at a fixed price of *${product.price.toLocaleString()} ETB*.\n\n` +
          `The price cannot be changed, but you can use this chat to negotiate:\n` +
          `• 📦 Delivery location & timing\n` +
          `• 🎁 Bundled accessories or extras\n` +
          `• 💳 Payment method (Cash, CBE Birr, Telebirr)\n\n` +
          `_Your AI Secretary will handle the conversation for you._`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
          `🤝 *Start Negotiation for ${product.title}*\n\n` +
          `Listing Price: *${product.price.toLocaleString()} ETB*\n` +
          `Seller: *${product.seller.channelName}*\n\n` +
          `What is the *absolute maximum budget* you are willing to spend for this product? (Type a number in ETB, e.g. 38000):`,
          { parse_mode: 'Markdown' }
        );
      }
      return;
    } catch (err) {
      console.error('Start negotiation flow error:', err);
      await ctx.reply('❌ Something went wrong starting the negotiation.');
      return;
    }
  }

  // ── Normal /start welcome ────────────────────────────────────────────────
  const isSeller = telegramId
    ? !!(await prisma.seller.findFirst({ where: { user: { telegramId: BigInt(telegramId) } } }).catch(() => null))
    : false;

  const welcomeMessage = isSeller
    ? `🎉 *Welcome back to EthioFlow!*\n\n` +
      `You are registered as a seller. Use the buttons below to post a product or search the marketplace.\n\n` +
      `📦 *Post a Product* — Start the listing wizard\n` +
      `🔍 *Search* — Browse products inline`
    : `🎉 *Welcome to EthioFlow!*\n\n` +
      `The unified marketplace connecting Ethiopian buyers and sellers.\n\n` +
      `🔍 *How to Search for Products:*\n` +
      `• Type \`@ethioflowerbot <search term>\` in any chat\n` +
      `• Or tap the *🔍 Search* button below\n\n` +
      `🛒 *Are you a seller?*\n` +
      `Add this bot as an Admin to your Telegram channel and tap *📦 Post a Product* to start listing!\n\n` +
      `📱 Start searching now and find great deals!`;

  await ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: DEFAULT_KEYBOARD,
  });
};
