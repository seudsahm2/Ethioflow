/**
 * Error Handler Middleware
 * 
 * Catches and handles errors that occur during bot operation.
 */

import { Context } from 'telegraf';

export const errorHandler = async (err: any, ctx: Context) => {
  console.error('[Bot Error]', err);
  
  try {
    await ctx.reply(
      '❌ An unexpected error occurred. Please try again later.\n\n' +
      'If the problem persists, please contact support.'
    );
  } catch (replyError) {
    console.error('[Error Handler] Failed to send error message:', replyError);
  }
};
