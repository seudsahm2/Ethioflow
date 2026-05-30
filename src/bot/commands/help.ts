import { Context } from 'telegraf';

export const helpCommand = async (ctx: Context) => {
  await ctx.reply('How to use EthioFlow:\n\nBuyers: Tag @EthioFlowBot in any chat to search for products.\nSellers: Add this bot to your channel as an admin to register your store.');
};
