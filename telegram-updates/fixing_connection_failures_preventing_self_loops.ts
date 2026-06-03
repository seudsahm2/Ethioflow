// ... existing code ...
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
        `*Please copy and send this message manually inside your chat to keep the negotiation active:*\n\n` +
        `\`${aiReply}\``,
        { parse_mode: 'Markdown' }
      );
      console.log(`[Engine] Prompted ${senderName} via private Bot DM to copy-paste message manually.`);
    } catch (e: any) {
      console.error(`[Engine] Failed to send copy-paste backup prompt to ${senderName}:`, e.message);
    }

    // Inform the receiver that a manual message is expected
    const recipientId = nextRole === 'buyer' ? sellerUser.telegramId : negotiation.buyerId;
    try {
      await bot.telegram.sendMessage(
        recipientId.toString(),
        `📩 *Pending Offer from ${senderName}'s Secretary:*\n\n` +
        `_${aiReply}_\n\n` +
        `*(Waiting for them to paste and send this in your private chat)*`,
        { parse_mode: 'Markdown' }
      );
    } catch (e: any) {
      console.error(`[Engine] Failed to send backup recipient notification:`, e.message);
    }

    // Keep messageDelivered = false! The automated engine loop pauses now.
    // When the user copy-pastes this message manually into their private chat,
    // your standard businessMessage.ts handler will intercept it and trigger the next turn naturally!
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

// ... existing code ...