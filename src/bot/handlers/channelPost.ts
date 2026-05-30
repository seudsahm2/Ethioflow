import { Context } from 'telegraf';

export const handleChannelPost = async (ctx: Context) => {
  // Logic to auto-sync new channel posts
  console.log('Received channel post:', ctx.channelPost);
};
