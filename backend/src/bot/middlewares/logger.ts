/**
 * Logger Middleware
 * 
 * Logs incoming updates for debugging and monitoring purposes.
 */

import { Context } from 'telegraf';

export const loggerMiddleware = async (ctx: Context, next: () => Promise<void>) => {
  const start = Date.now();
  
  // Log incoming update
  const updateType = ctx.updateType;
  const userId = ctx.from?.id;
  const username = ctx.from?.username || ctx.from?.first_name || 'Unknown';
  
  console.log(`[${new Date().toISOString()}] ${updateType} from ${username} (${userId})`);
  
  // Continue to next middleware
  await next();
  
  // Log processing time
  const ms = Date.now() - start;
  console.log(`[${new Date().toISOString()}] Processed in ${ms}ms`);
};
