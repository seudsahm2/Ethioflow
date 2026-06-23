import { Telegraf, Context } from 'telegraf';
import { SellerService } from '../../core/services/sellerService';

export function setupMyChatMemberHandler(bot: Telegraf<Context>) {
  bot.on('my_chat_member', async (ctx) => {
    const chat = ctx.chat;
    const newStatus = ctx.myChatMember.new_chat_member.status;
    const oldStatus = ctx.myChatMember.old_chat_member.status;
    
    // We only care if we are added as an administrator to a channel
    if (chat.type === 'channel' && newStatus === 'administrator' && oldStatus !== 'administrator') {
      const channelId = chat.id;
      const channelName = 'title' in chat ? chat.title : 'Unknown Channel';
      const user = ctx.from; // the user who added the bot
      
      if (user) {
        try {
          const userId = user.id.toString();
          await SellerService.registerSeller(userId, channelId.toString(), channelName);
          console.log(`Successfully registered seller for channel: ${channelName}`);
        } catch (error) {
          console.error(`Failed to register seller for channel ${channelName}:`, error);
        }
      }
    }
  });
}
