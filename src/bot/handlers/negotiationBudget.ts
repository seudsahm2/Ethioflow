import { Telegraf, Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { handleNegotiationStep } from './negotiationEngine';
import { pendingMinPrice } from '../state';

const prisma = new PrismaClient();

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export function setupNegotiationBudgetHandler(bot: Telegraf<Context>) {
  bot.on('text', async (ctx, next) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return next();

    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return next();

    try {
      // ── Case 0: SELLER is setting their secret minimum price ─────────────────────
      const pendingProductId = pendingMinPrice.get(telegramId.toString());
      if (pendingProductId) {
        const minPrice = parseFloat(text.replace(/,/g, ''));
        if (isNaN(minPrice) || minPrice <= 0) {
          await ctx.reply('❌ Please enter a valid positive number for your minimum price (e.g. *38000*).', { parse_mode: 'Markdown' });
          return;
        }

        const product = await prisma.product.findUnique({ where: { id: pendingProductId } });
        if (!product) {
          pendingMinPrice.delete(telegramId.toString());
          return next();
        }

        if (minPrice >= product.price) {
          await ctx.reply(
            `⚠️ *Minimum price must be below your listing price* (${product.price.toLocaleString()} ETB).\n\nEnter a lower number:`,
            { parse_mode: 'Markdown' }
          );
          return;
        }

        await prisma.product.update({
          where: { id: pendingProductId },
          data: { minPrice }
        });

        pendingMinPrice.delete(telegramId.toString());

        const discountPct = (((product.price - minPrice) / product.price) * 100).toFixed(1);
        await ctx.reply(
          `✅ *Floor price set!*\n\n` +
          `📦 Product: *${product.title}*\n` +
          `🏷️ Listing Price: *${product.price.toLocaleString()} ETB*\n` +
          `🔒 Your Secret Minimum: *${minPrice.toLocaleString()} ETB* (${discountPct}% discount ceiling)\n\n` +
          `Your AI Secretary will never go below this price during any negotiation.`,
          { parse_mode: 'Markdown' }
        );
        console.log(`[MinPrice] Seller ${telegramId} set minPrice=${minPrice} for product ${pendingProductId}`);
        return;
      }

      // ── Case 1: Buyer is SETTING their budget ─────────────────────────────
      const awaitingNeg = await prisma.negotiation.findFirst({
        where: { buyerId: BigInt(telegramId), status: 'AWAITING_BUDGET' },
        include: { product: { include: { seller: { include: { user: true } } } } }
      });

      if (awaitingNeg) {
        const budget = parseFloat(text.replace(/,/g, ''));
        if (isNaN(budget) || budget <= 0) {
          await ctx.reply('❌ Please enter a valid positive number (e.g. 35000):');
          return;
        }

        const listingPrice = awaitingNeg.product.price;
        if (budget < listingPrice * 0.5) {
          await ctx.reply(
            `⚠️ *Budget too low!*\n\n` +
            `*${budget.toLocaleString()} ETB* is under 50% of the listing price (*${listingPrice.toLocaleString()} ETB*).\n\nEnter a more realistic budget:`,
            { parse_mode: 'Markdown' }
          );
          return;
        }

        // Activate negotiation with buyer's budget
        await prisma.negotiation.update({
          where: { id: awaitingNeg.id },
          data: { buyerMax: budget, status: 'ACTIVE', lastSender: 'BUYER' }
        });

        const sellerUser = awaitingNeg.product.seller.user;
        const buyerUser = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

        const isDirectSecretaryModePossible = !!(buyerUser?.businessConnectionId && sellerUser.businessConnectionId);

        // Pre-fill the opening message
        const openingMessage =
          `🤝 Hi! I'm interested in your *${awaitingNeg.product.title}* listed at *${listingPrice.toLocaleString()} ETB*.\n\n` +
          `I'd like to negotiate the price. What's your best offer?`;

        await prisma.negotiationMessage.create({
          data: { negotiationId: awaitingNeg.id, sender: 'BUYER', text: openingMessage }
        });

        if (isDirectSecretaryModePossible) {
          // Double-blind profile-to-profile Secretary Mode
          const urlEncodedText = encodeURIComponent(
            `Hi! I'm interested in negotiating for your "${awaitingNeg.product.title}". What's your best offer?`
          );

          let startUrl = '';
          let instruction = '';

          if (sellerUser.username) {
            startUrl = `https://t.me/${sellerUser.username}?text=${urlEncodedText}`;
            instruction = `Tap the button below to open the chat with the seller and send the pre-filled opening message.`;
          } else {
            startUrl = `tg://user?id=${sellerUser.telegramId}`;
            instruction = `Tap the button below to open the chat with the seller, then send this message:\n\n\`Hi! I'm interested in negotiating for your "${awaitingNeg.product.title}". What's your best offer?\``;
          }

          await ctx.reply(
            `✅ *Maximum budget set to ${budget.toLocaleString()} ETB!*\n\n` +
            `💼 *Secretary Mode Activated!*\n` +
            `Both you and the seller have connected business profiles. You can negotiate directly in your private chat!\n\n` +
            `${instruction}\n\n` +
            `Once you send the first message, the AI Secretaries will take over the chat and negotiate autonomously!`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '💬 Open Chat & Send Offer', url: startUrl }]
                ]
              }
            }
          );

          // Notify seller in their bot DM with full product context card
          const sellerFloor = awaitingNeg.product.minPrice > 0
            ? awaitingNeg.product.minPrice
            : awaitingNeg.product.price * 0.85;
          await bot.telegram.sendMessage(
            sellerUser.telegramId.toString(),
            `🔔 *New Negotiation Started — Secretary Mode Active*\n\n` +
            `📦 *Product:* ${awaitingNeg.product.title}\n` +
            `🏷️ *Listing Price:* ${awaitingNeg.product.price.toLocaleString()} ETB\n` +
            `🔒 *Your Floor:* ${sellerFloor.toLocaleString()} ETB (secret, never shown to buyer)\n\n` +
            `🤖 Your AI Secretary is now negotiating in your chat. You can intervene anytime by typing manually — the bot will pause for 30 minutes.`,
            { parse_mode: 'Markdown' }
          ).catch(e => console.warn('[Notify Seller] Failed:', e?.message));
        } else {
          // Fallback to bot broker relay mode
          await ctx.reply(
            `✅ *Maximum budget set to ${budget.toLocaleString()} ETB!*\n\n` +
            `🤖 *Bot Relay Mode Activated!*\n` +
            `We will handle the negotiation with the seller right here in this chat.\n\n` +
            `⏳ Initiating opening offer...`,
            { parse_mode: 'Markdown' }
          );

          // Relay: notify seller via bot DM with full product context card
          const sellerFloorRelay = awaitingNeg.product.minPrice > 0
            ? awaitingNeg.product.minPrice
            : awaitingNeg.product.price * 0.85;
          await bot.telegram.sendMessage(
            sellerUser.telegramId.toString(),
            `🔔 *New Negotiation Request — Bot Relay Mode*\n\n` +
            `📦 *Product:* ${awaitingNeg.product.title}\n` +
            `🏷️ *Listing Price:* ${awaitingNeg.product.price.toLocaleString()} ETB\n` +
            `🔒 *Your Floor:* ${sellerFloorRelay.toLocaleString()} ETB (secret, never shown to buyer)\n\n` +
            `💬 *Opening Offer from Buyer:*\n“${openingMessage}”\n\n` +
            `🤖 Your AI Secretary will respond automatically. You can intervene anytime by typing manually.`,
            { parse_mode: 'Markdown' }
          ).catch(e => console.warn('Relay to seller failed:', e?.message));

          // Trigger automated turn for the seller
          setTimeout(() => {
            handleNegotiationStep(bot, awaitingNeg.id).catch(e => console.error('Seller first-response error:', e));
          }, 3000);
        }

        return;
      }

      // ── Case 2: Buyer is CONTINUING relay negotiation ────────────────────
      const activeNeg = await prisma.negotiation.findFirst({
        where: { buyerId: BigInt(telegramId), status: 'ACTIVE' },
        include: { product: { include: { seller: { include: { user: true } } } } }
      });

      if (!activeNeg) return next();

      // Record buyer's reply
      await prisma.negotiationMessage.create({
        data: { negotiationId: activeNeg.id, sender: 'BUYER', text }
      });
      await prisma.negotiation.update({
        where: { id: activeNeg.id },
        data: { lastSender: 'BUYER' }
      });

      // Acknowledge and trigger seller AI response
      await ctx.reply(`💬 *Your message:* "${text}"\n\n⏳ Seller's AI is responding...`, { parse_mode: 'Markdown' });

      setTimeout(() => {
        handleNegotiationStep(bot, activeNeg.id).catch(e => console.error('Seller relay response error:', e));
      }, 3000);

    } catch (err: any) {
      console.error('Negotiation handler error:', err?.message || err);
      await ctx.reply(`❌ Error: ${err?.message || 'Unknown error'}. Please try again.`);
    }
  });
}
