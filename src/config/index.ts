// Environment variables, constants
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
};
