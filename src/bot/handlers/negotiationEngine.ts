import { Telegraf, Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { runAgentNegotiation, runFixedPriceNegotiation } from '../../core/ai';

const prisma = new PrismaClient();

// ── ENGINE STEP: Evaluates state and runs AI turn if appropriate ───────────────
export async function handleNegotiationStep(bot: Telegraf<Context>, negotiationId: string) {
  const negotiation = await prisma.negotiation.findUnique({
    where: { id: negotiationId },
    include: {
      product: { include: { seller: { include: { user: true } } } },
      messages: { orderBy: { createdAt: 'asc' } }
    }
  });

  if (!negotiation || negotiation.status !== 'ACTIVE') return;

  const buyerUser = await prisma.user.findUnique({ where: { telegramId: negotiation.buyerId } });
  const sellerUser = negotiation.product.seller.user;

  // Next turn is determined by opposite of lastSender
  const nextRole: 'buyer' | 'seller' = negotiation.lastSender === 'BUYER' ? 'seller' : 'buyer';

  // ✅ COMPLIANCE: Manual Takeover Check.
  // If the next speaker has manually typed a message in this DM chat within the last 30 minutes,
  // their AI Secretary must step aside to let them chat directly. The opposite secretary remains active.
  const THIRTY_MINUTES = 30 * 60 * 1000;
  if (nextRole === 'buyer') {
    const isBuyerInTakeover = buyerUser?.lastManualInterventionAt && 
      (Date.now() - new Date(buyerUser.lastManualInterventionAt).getTime() < THIRTY_MINUTES);
    if (isBuyerInTakeover) {
      console.log(`[Engine] Skipping automated turn for Negotiation ${negotiationId}: Buyer manual takeover active.`);
      return;
    }
  } else {
    const isSellerInTakeover = sellerUser?.lastManualInterventionAt && 
      (Date.now() - new Date(sellerUser.lastManualInterventionAt).getTime() < THIRTY_MINUTES);
    if (isSellerInTakeover) {
      console.log(`[Engine] Skipping automated turn for Negotiation ${negotiationId}: Seller manual takeover active.`);
      return;
    }
  }

  console.log(`[Engine] Step for Negotiation ${negotiationId}: Running ${nextRole.toUpperCase()}'s turn.`);

  const chatHistoryText = negotiation.messages
    .map(m => `${m.sender}: ${m.text}`)
    .join('\n');

  const productTitle = negotiation.product.title;
  const listingPrice = negotiation.product.price;
  const isFixedPrice = negotiation.product.isFixedPrice;

  // Enforce backbone: fall back to 85% of listing price if minimum price is not specified or 0
  let secretLimit = nextRole === 'buyer'
    ? negotiation.buyerMax
    : (negotiation.product.minPrice > 0 ? negotiation.product.minPrice : negotiation.product.price * 0.85);

  const senderUser = nextRole === 'buyer' ? buyerUser : sellerUser;
  const recipientTelegramId = nextRole === 'buyer' ? sellerUser.telegramId : negotiation.buyerId;

  // Send typing action to humanize (only if connection allows replying)
  if (senderUser?.businessConnectionId && senderUser.canReply !== false) {
    await (bot.telegram as any).callApi('sendChatAction', {
      chat_id: recipientTelegramId.toString(),
      action: 'typing',
      business_connection_id: senderUser.businessConnectionId
    }).catch(() => {});
  } else {
    await bot.telegram.sendChatAction(recipientTelegramId.toString(), 'typing').catch(() => {});
  }

  // Realistic human thinking delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

  // Route to correct AI function based on product type
  let aiReply: string;
  if (isFixedPrice) {
    aiReply = await runFixedPriceNegotiation(
      nextRole,
      productTitle,
      listingPrice,
      chatHistoryText,
      negotiation.product.category || 'Other'
    );
  } else {
    aiReply = await runAgentNegotiation(
      nextRole,
      productTitle,
      listingPrice,
      secretLimit,
      chatHistoryText,
      negotiation.product.category || 'Other'
    );
  }

  const isDealAccepted = aiReply.includes('[DEAL_ACCEPTED]');
  aiReply = aiReply.replace('[DEAL_ACCEPTED]', '').trim();
  if (isDealAccepted && !aiReply) {
    aiReply = "I accept this price! Let's finalize the deal.";
  }

  // Log response to DB
  const loggedMsg = await prisma.negotiationMessage.create({
    data: {
      negotiationId: negotiation.id,
      sender: nextRole.toUpperCase(),
      text: aiReply
    }
  });

  // Flip Turn Tracker
  await prisma.negotiation.update({
    where: { id: negotiation.id },
    data: { lastSender: nextRole.toUpperCase() }
  });

  // ── DELIVERY STRATEGY ─────────────────────────────────────────────────────
  // Try sender's own business connection first (message appears naturally as their words).
  // If that fails, we MUST fallback cleanly to a copy-paste interface to avoid infinite loops.

  let messageDelivered = false;
  let sentViaBusinessConnection = false;

  // -- Primary: sender's own business connection (only if permission is granted to reply)
  if (senderUser?.businessConnectionId && senderUser.canReply !== false) {
    try {
      const res = await (bot.telegram as any).callApi('sendMessage', {
        chat_id: recipientTelegramId.toString(),
        text: aiReply,
        parse_mode: 'Markdown',
        business_connection_id: senderUser.businessConnectionId
      });
      sentViaBusinessConnection = true;
      messageDelivered = true;
      console.log(`[Engine] Replied as ${nextRole.toUpperCase()} via own business connection to ${recipientTelegramId}`);
      if (res && res.message_id) {
        await prisma.negotiationMessage.update({
          where: { id: loggedMsg.id },
          data: { telegramMessageId: res.message_id }
        }).catch(() => {});
      }
    } catch (e: any) {
      console.warn(`[Engine] Business connection failed for ${nextRole}: ${e.message}.`);
    }
  }

  if (!sentViaBusinessConnection) {
    // ⚠️ CRITICAL COMPLIANCE FIX:
    // To completely prevent self-loops and "BUSINESS_PEER_INVALID" errors where
    // one user's bot echoes message turns as the wrong person, we NEVER use the opposite 
    // connection. Instead, we alert the disconnected owner to manually copy-paste.
    const senderId = nextRole === 'buyer' ? negotiation.buyerId : sellerUser.telegramId;
    const senderName = nextRole === 'buyer' ? 'Buyer' : 'Seller';

    try {
      await bot.telegram.sendMessage(
        senderId.toString(),
        `⚠️ *Secretary Sync Warning!*\n\n` +
        `Your AI Secretary couldn't auto-send the reply due to a Telegram connection sync issue.\n\n` +
        `*Please copy and send this message manually inside your chat to keep the active conversation synced:*\n\n` +
        `\`${aiReply}\``,
        { parse_mode: 'Markdown' }
      );
      console.log(`[Engine] Prompted ${senderName} via private Bot DM to copy-paste message manually.`);
    } catch (e: any) {
      console.error(`[Engine] Failed to send copy-paste backup prompt to ${senderName}:`, e.message);
    }

    // COMPLIANCE & AUTO-RECOVERY RELAY:
    // To keep the AI double-blind negotiation fully active even when one side has connection sync issues,
    // we deliver the AI's response directly to the recipient's Bot DM as a fallback relay.
    const recipientId = nextRole === 'buyer' ? sellerUser.telegramId : negotiation.buyerId;
    const prefix = nextRole === 'buyer' ? `🛒 *Buyer's Secretary:*` : `🏪 *Seller's Secretary:*`;
    try {
      await bot.telegram.sendMessage(
        recipientId.toString(),
        `${prefix}\n\n${aiReply}`,
        { parse_mode: 'Markdown' }
      );
      // We successfully delivered the message to the recipient's DM backup channel!
      // Set messageDelivered = true to let the automated turn scheduler continue the AI-to-AI negotiation.
      messageDelivered = true;
      console.log(`[Engine] Backed up delivery of ${nextRole.toUpperCase()} response via Bot DM to ${recipientId}. Automated turn loop will continue.`);
    } catch (e: any) {
      console.error(`[Engine] Failed to send backup recipient notification:`, e.message);
    }
  }

  // Handle deal closure or keep ping-pong loop running
  if (isDealAccepted) {
    console.log(`[Engine] AI Agents reached agreement for Negotiation ${negotiationId}! Entering approval flow.`);
    await initiateApprovalFlow(bot, negotiationId);
    return;
  }

  // ── TURN SCHEDULING ────────────────────────────────────────────────────────
  // Only schedule next turn if message was delivered automatically.
  if (messageDelivered) {
    const newNextRole: 'buyer' | 'seller' = nextRole === 'buyer' ? 'seller' : 'buyer';
    console.log(`[Engine] Scheduling automated turn for ${newNextRole.toUpperCase()} in 3.0 seconds.`);
    setTimeout(() => {
      handleNegotiationStep(bot, negotiationId).catch(e => console.error(`[Engine] Auto-turn failed:`, e));
    }, 3000);
  } else {
    console.warn(`[Engine] Message delivery was manually deferred. Pausing loop to prevent runaway spam.`);
  }
}


// ── INITIALIZE APPROVAL FLOW: Sends Accept/Decline buttons to both users ───────
async function initiateApprovalFlow(bot: Telegraf<Context>, negotiationId: string) {
  const negotiation = await prisma.negotiation.update({
    where: { id: negotiationId },
    data: { status: 'AWAITING_APPROVAL' }
  });

  const product = await prisma.product.findUnique({
    where: { id: negotiation.productId }
  });

  if (!product) return;

  const lastMessage = await prisma.negotiationMessage.findFirst({
    where: { negotiationId },
    orderBy: { createdAt: 'desc' }
  });

  const agreedPriceText = lastMessage?.text || '';
  const match = agreedPriceText.match(/\d+([.,]\d+)?/);
  const agreedPrice = match ? match[0] : 'agreed';

  const buyerUser = await prisma.user.findUnique({ where: { telegramId: negotiation.buyerId } });
  const sellerUser = await prisma.user.findFirst({
    where: { seller: { id: product.sellerId } }
  });

  const appBotInfo = await bot.telegram.getMe();
  const botUsername = appBotInfo.username;

  // 1. Post notification inside the Direct DM Chat via Business connection
  const directNegotiationNotice = `🤝 *AI Secretaries agreed on a price of ${agreedPrice} ETB!*\n\nFinal confirmation is pending in the bot. Please check your messages in @${botUsername} to confirm or decline the deal.`;

  if (buyerUser?.businessConnectionId) {
    await (bot.telegram as any).callApi('sendMessage', {
      chat_id: sellerUser?.telegramId.toString(),
      text: directNegotiationNotice,
      parse_mode: 'Markdown',
      business_connection_id: buyerUser.businessConnectionId
    }).catch(() => {});
  } else if (sellerUser?.businessConnectionId) {
    await (bot.telegram as any).callApi('sendMessage', {
      chat_id: negotiation.buyerId.toString(),
      text: directNegotiationNotice,
      parse_mode: 'Markdown',
      business_connection_id: sellerUser.businessConnectionId
    }).catch(() => {});
  }

  // 2. Send interactive approval card to their private Bot DMs
  const approvalPromptMsg = 
    `🤝 *Deal Proposed by AI Secretaries!*\n\n` +
    `An agreement of *${agreedPrice} ETB* has been reached for *${product.title}*.\n\n` +
    `Do you accept this deal?`;

  const markup = (role: 'buyer' | 'seller') => ({
    inline_keyboard: [
      [
        { text: '✅ Accept Deal', callback_data: `neg_accept:${role}:${negotiationId}` },
        { text: '❌ Decline Deal', callback_data: `neg_decline:${role}:${negotiationId}` }
      ]
    ]
  });

  // Always send to private Bot DMs (so users have a clean, unambiguous place to approve/decline)
  await bot.telegram.sendMessage(negotiation.buyerId.toString(), approvalPromptMsg, {
    parse_mode: 'Markdown',
    reply_markup: markup('buyer')
  }).catch(e => console.error('Failed to send approval to buyer Bot DM:', e.message));

  if (sellerUser) {
    await bot.telegram.sendMessage(sellerUser.telegramId.toString(), approvalPromptMsg, {
      parse_mode: 'Markdown',
      reply_markup: markup('seller')
    }).catch(e => console.error('Failed to send approval to seller Bot DM:', e.message));
  }
}

// ── CALLBACK HANDLERS: Process explicit Accept/Decline decisions ───────────────
export function setupApprovalCallbackHandlers(bot: Telegraf<Context>) {
  bot.on('callback_query', async (ctx, next) => {
    const data = (ctx.callbackQuery as any).data || '';
    if (!data.startsWith('neg_accept:') && !data.startsWith('neg_decline:')) return next();

    const parts = data.split(':');
    const action = parts[0];
    const role = parts[1];
    const negotiationId = parts[2];
    const telegramId = ctx.from?.id;

    try {
      const negotiation = await prisma.negotiation.findUnique({
        where: { id: negotiationId },
        include: { product: { include: { seller: { include: { user: true } } } } }
      });

      if (!negotiation) {
        await ctx.answerCbQuery('❌ Negotiation not found.');
        return;
      }

      if (negotiation.status !== 'AWAITING_APPROVAL') {
        await ctx.answerCbQuery('⚠️ This deal has already been finalized.');
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
        return;
      }

      const expectedId = role === 'buyer'
        ? negotiation.buyerId
        : negotiation.product.seller.user.telegramId;

      if (BigInt(telegramId) !== expectedId) {
        await ctx.answerCbQuery('❌ You are not authorized to make this decision.');
        return;
      }

      if (action === 'neg_accept') {
        const updateData: any = {};
        if (role === 'buyer') updateData.buyerApproved = true;
        if (role === 'seller') updateData.sellerApproved = true;

        const updated = await prisma.negotiation.update({
          where: { id: negotiationId },
          data: updateData
        });

        await ctx.answerCbQuery('✅ You accepted the deal!');
        await ctx.editMessageText(
          `⏳ *You accepted the deal!*\n\nWaiting for the other party to accept...`,
          { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [] } }
        ).catch(() => {});

        if (updated.buyerApproved && updated.sellerApproved) {
          await finalizeDeal(bot, negotiationId);
        }
      } else {
        await prisma.negotiation.update({
          where: { id: negotiationId },
          data: { status: 'FAILED' }
        });

        await ctx.answerCbQuery('❌ Deal declined.');
        await ctx.editMessageText(
          `❌ *You declined the deal.*\n\nNegotiation ended.`,
          { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [] } }
        ).catch(() => {});

        const otherId = role === 'buyer'
          ? negotiation.product.seller.user.telegramId
          : negotiation.buyerId;

        const otherUser = await prisma.user.findUnique({ where: { telegramId: otherId } });
        const declineMsg = `❌ *Deal Declined*\n\nThe proposed deal for *${negotiation.product.title}* was declined by the other party.`;

        await bot.telegram.sendMessage(otherId.toString(), declineMsg, { parse_mode: 'Markdown' }).catch(() => {});
      }
    } catch (e) {
      console.error('Error in callback query:', e);
      await ctx.answerCbQuery('❌ Error processing request.');
    }
  });
}

// ── FINALIZE DEAL: Set SUCCESS status and send final contact card ──────────────
async function finalizeDeal(bot: Telegraf<Context>, negotiationId: string) {
  const negotiation = await prisma.negotiation.update({
    where: { id: negotiationId },
    data: { status: 'SUCCESS' }
  });

  const product = await prisma.product.findUnique({
    where: { id: negotiation.productId }
  });

  if (!product) return;

  const lastMessage = await prisma.negotiationMessage.findFirst({
    where: { negotiationId },
    orderBy: { createdAt: 'desc' }
  });

  const agreedPriceText = lastMessage?.text || '';
  const match = agreedPriceText.match(/\d+([.,]\d+)?/);
  const agreedPrice = match ? match[0] : 'agreed';

  const buyerUser = await prisma.user.findUnique({ where: { telegramId: negotiation.buyerId } });
  const sellerUser = await prisma.user.findFirst({
    where: { seller: { id: product.sellerId } }
  });

  const successMsg =
    `🎉 *Deal Closed Successfully!*\n\n` +
    `Both buyer and seller have accepted the price of *${agreedPrice} ETB* for *${product.title}*!\n\n` +
    `Contact details to arrange delivery/pickup:\n` +
    `• Buyer: [${buyerUser?.firstName || 'Buyer'}](tg://user?id=${negotiation.buyerId})\n` +
    `• Seller: [${sellerUser?.firstName || 'Seller'}](tg://user?id=${sellerUser?.telegramId})\n\n` +
    `_EthioFlow Secretary Mode — Transaction Confirmed_`;

  // Deliver success cards to their Bot DMs
  await bot.telegram.sendMessage(negotiation.buyerId.toString(), successMsg, { parse_mode: 'Markdown' }).catch(() => {});
  if (sellerUser) {
    await bot.telegram.sendMessage(sellerUser.telegramId.toString(), successMsg, { parse_mode: 'Markdown' }).catch(() => {});
  }

  // Also post confirmation in the direct chat
  const directSuccessMsg = `🎉 *Deal Officially Confirmed!* Both parties have accepted the price of *${agreedPrice} ETB* for *${product.title}*. Check @${bot.botInfo?.username} for details.`;
  if (buyerUser?.businessConnectionId) {
    await (bot.telegram as any).callApi('sendMessage', {
      chat_id: sellerUser?.telegramId.toString(),
      text: directSuccessMsg,
      parse_mode: 'Markdown',
      business_connection_id: buyerUser.businessConnectionId
    }).catch(() => {});
  } else if (sellerUser?.businessConnectionId) {
    await (bot.telegram as any).callApi('sendMessage', {
      chat_id: negotiation.buyerId.toString(),
      text: directSuccessMsg,
      parse_mode: 'Markdown',
      business_connection_id: sellerUser.businessConnectionId
    }).catch(() => {});
  }
}
