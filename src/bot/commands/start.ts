import { Context } from 'telegraf';

export const startCommand = async (ctx: Context) => {
  await ctx.reply('Welcome to EthioFlow! The unified marketplace for Ethiopian buyers and sellers.');
};
