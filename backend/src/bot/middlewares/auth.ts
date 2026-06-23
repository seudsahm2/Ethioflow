import { Context } from 'telegraf';

export const authMiddleware = async (ctx: Context, next: () => Promise<void>) => {
  // Authentication logic here
  await next();
};
