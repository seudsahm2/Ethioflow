import { Telegraf, Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { handleNegotiationStep } from './negotiationEngine';

const prisma = new PrismaClient();

export function setupBusinessMessageHandler(bot: Telegraf<Context>) {
  // Catch incoming/outgoing business messages using raw update middleware
  bot.use(async (ctx, next) => {
    const update = ctx.update as any;

    // ── 1. DELETED MESSAGES HANDLER (COMPLIANCE) ─────────────────────────────
    if (update.deleted_business_messages) {
      const del = update.deleted_business_messages;
      const messageIds: number[] = del.message_ids;
      console.log(`💼 Business Connection: Message deletions received. IDs:`, messageIds);

      try {
        const deletedResult = await prisma.negotiationMessage.deleteMany({
          where: {
            telegramMessageId: { in: messageIds }
          }
        });
        console.log(`✅ Synced deletions: Removed ${deletedResult.count} messages from database.`);
      } catch (err) {
        console.error('Failed to sync deleted business messages:', err);
      }
      return next();
    }

    // ── 2. EDITED MESSAGES HANDLER (COMPLIANCE) ──────────────────────────────
    if (update.edited_business_message) {
      const editedMsg = update.edited_business_message;
      const text: string = editedMsg.text;
      const messageId: number = editedMsg.message_id;

      if (!text) return next();

      console.log(`💼 Business Connection: Message edit received. ID: ${messageId} | New Text: "${text}"`);

      try {
        const updated = await prisma.negotiationMessage.updateMany({
          where: { telegramMessageId: messageId },
          data: { text }
        });
        console.log(`✅ Synced edits: Updated ${updated.count} message(s) in database.`);
      } catch (err) {
        console.error('Failed to sync edited business message:', err);
      }
      return next();
    }

    // ── 3. STANDARD BUSINESS MESSAGE HANDLER ─────────────────────────────────
    if (!update.business_message) return next();

    const businessMsg = update.business_message;
    const businessConnectionId: string = businessMsg.business_connection_id;
    const message = businessMsg;

    console.log(`[BusinessMessage] Incoming message text: "${message?.text}", from.id: ${message?.from?.id}, chat.id: ${message?.chat?.id}, connId: ${businessConnectionId}`);

    if (!message?.text) {
      console.log(`[BusinessMessage] Early return: Message text is empty.`);
      return;
    }

    // 🔑 CRITICAL: Ignore messages sent BY the bot itself (via business connection).
    // Telegram fires a business_message update for OUTGOING messages too (from.is_self = true).
    if (message.from?.is_self === true) {
      console.log('[BusinessMessage] Ignoring self-sent message to prevent loop.');
      return;
    }

    const chatParticipantId: number = message.from?.id || message.chat?.id;
    const text: string = message.text;
    const telegramMessageId: number = message.message_id;

    try {
      // Find the business connection owner
      const owner = await prisma.user.findFirst({
        where: { businessConnectionId }
      });

      if (!owner) {
        console.log(`[BusinessMessage] Early return: No user found with businessConnectionId: "${businessConnectionId}"`);
        return;
      }

      const ownerTelegramId = owner.telegramId;
      console.log(`[BusinessMessage] Owner user found: ID ${owner.id}, telegramId: ${ownerTelegramId}`);

      // Find the ACTIVE negotiation between the owner and the participant
      const negotiation = await prisma.negotiation.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [
            { buyerId: ownerTelegramId, sellerId: BigInt(chatParticipantId) },
            { buyerId: BigInt(chatParticipantId), sellerId: ownerTelegramId }
          ]
        },
        include: {
          product: {
            include: {
              seller: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (!negotiation) {
        console.log(`[BusinessMessage] Early return: No ACTIVE negotiation found for owner ${ownerTelegramId} and participant ${chatParticipantId}`);
        return;
      }

      // Determine who sent this text
      const senderRole: 'BUYER' | 'SELLER' = BigInt(message.from.id) === negotiation.buyerId
        ? 'BUYER'
        : 'SELLER';

      console.log(`[BusinessMessage] Human ${senderRole} typed: "${text.substring(0, 60)}"`);

      // Check if this message was manually typed by the business connection owner (Takeover Detection)
      const isFromOwner = BigInt(message.from.id) === owner.telegramId;

      if (isFromOwner) {
        console.log(`[BusinessMessage] Owner manually sent a message. Activating AI quiet window (30m).`);
        await prisma.user.update({
          where: { id: owner.id },
          data: { lastManualInterventionAt: new Date() }
        });
      }

      // Log the message with telegramMessageId
      await prisma.negotiationMessage.create({
        data: {
          negotiationId: negotiation.id,
          sender: senderRole,
          text,
          telegramMessageId
        }
      });

      // Update turn tracker
      await prisma.negotiation.update({
        where: { id: negotiation.id },
        data: { lastSender: senderRole }
      });

      // If the owner has disabled reply permissions (canReply = false),
      // we must act as a Read-Only Monitor. We log the messages but do not trigger AI replies.
      if (owner.canReply === false) {
        console.log(`[BusinessMessage] Bot is in Read-Only Monitor mode for owner ${owner.telegramId}. Skipping AI reply.`);
        return;
      }

      // Find buyer user
      const buyerUser = await prisma.user.findUnique({
        where: { telegramId: negotiation.buyerId }
      });
      const sellerUser = negotiation.product.seller.user;

      // Check if manual takeover is active for the NEXT speaker
      // Since senderRole just spoke, the next speaker is the opposite role.
      const THIRTY_MINUTES = 30 * 60 * 1000;
      if (senderRole === 'BUYER') {
        // Next speaker is SELLER, so check if Seller has taken over their own bot
        const isSellerInTakeover = sellerUser?.lastManualInterventionAt && 
          (Date.now() - new Date(sellerUser.lastManualInterventionAt).getTime() < THIRTY_MINUTES);
        if (isSellerInTakeover) {
          console.log(`[BusinessMessage] Seller manual takeover is active. Skipping AI response for Seller.`);
          return;
        }
      } else {
        // Next speaker is BUYER, so check if Buyer has taken over their own bot
        const isBuyerInTakeover = buyerUser?.lastManualInterventionAt && 
          (Date.now() - new Date(buyerUser.lastManualInterventionAt).getTime() < THIRTY_MINUTES);
        if (isBuyerInTakeover) {
          console.log(`[BusinessMessage] Buyer manual takeover is active. Skipping AI response for Buyer.`);
          return;
        }
      }

      // Trigger the engine to process the next step (which will run the opposite AI agent)
      await handleNegotiationStep(bot, negotiation.id);

    } catch (err) {
      console.error('Error in businessMessage handler:', err);
    }
  });
}
