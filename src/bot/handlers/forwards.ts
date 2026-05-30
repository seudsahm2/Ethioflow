import { Context } from 'telegraf';

export const handleForwards = async (ctx: Context) => {
  // Logic to handle past inventory syncing via forwarded messages
  console.log('Received forwarded message:', ctx.message);
};
