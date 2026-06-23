import { Telegraf, Context } from 'telegraf';
import { createProduct } from '../../core/services/productService';
import { parseProductFromText } from '../../core/ai';
import { PrismaClient } from '@prisma/client';
import { pendingMinPrice } from '../state';
import { uploadToPublicHost } from '../../core/utils/imageUpload';

const prisma = new PrismaClient();

export function setupChannelHandlers(bot: Telegraf<Context>) {
  bot.on('channel_post', async (ctx) => {
    const post = ctx.channelPost;
    
    let text = '';
    let photoId: string | undefined;

    if ('text' in post) {
      text = post.text;
    } else if ('caption' in post) {
      text = post.caption || '';
    }

    if ('photo' in post && post.photo.length > 0) {
      // Get the largest photo
      const largestPhoto = post.photo[post.photo.length - 1];
      
      try {
        // Fetch the file from Telegram
        const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id);
        const response = await fetch(fileLink.toString());
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Upload to public host to get a real HTTPS URL
        photoId = await uploadToPublicHost(buffer, `${largestPhoto.file_id}.jpg`);
      } catch (err) {
        console.error('Failed to process image:', err);
        photoId = undefined;
      }
    }

    if (!text) {
      // If there's no text/caption, we might not be able to parse product info.
      return;
    }

    try {
      // Look up the seller by their Telegram channel ID and include their user record to get telegramId
      const seller = await prisma.seller.findUnique({
        where: { channelId: BigInt(ctx.chat.id) },
        include: { user: true }
      });

      if (!seller) {
        // Channel not registered — bot is admin here but seller hasn't been onboarded
        console.log(`Channel ${ctx.chat.id} not registered as a seller. Skipping post.`);
        return;
      }

      const parsedProduct = await parseProductFromText(text);
      
      if (parsedProduct) {
        const productData = {
          ...parsedProduct,
          imageUrl: photoId,
        };
        
        // Pass the DB seller UUID (not the Telegram chat ID)
        await createProduct(seller.id, productData);
        console.log(`Product saved from channel ${ctx.chat.id} (seller: ${seller.channelName}). Draft: ${parsedProduct.isDraft}`);

        // If the product is a draft (missing fields), punish the seller and notify them
        if (parsedProduct.isDraft && parsedProduct.missingFields) {
          // Lower trust score by 1
          await prisma.seller.update({
            where: { id: seller.id },
            data: { trustScore: { decrement: 1 } }
          }).catch(console.error);

          // Generate explicit, friendly error messages
          const missingArray = parsedProduct.missingFields.split(',');
          let missingReasons = '';
          if (missingArray.includes('title')) missingReasons += `❌ *Title:* We couldn't figure out the name of the product.\n`;
          if (missingArray.includes('price')) missingReasons += `❌ *Price:* You must explicitly state the price in ETB.\n`;
          
          if (!missingReasons) {
            missingReasons = `❌ *Missing Data:* ${parsedProduct.missingFields}\n`;
          }

          // Send direct message to the admin/owner instead of replying in the channel
          await ctx.telegram.sendMessage(
            seller.user.telegramId.toString(),
            `⚠️ *Post Rejected in ${seller.channelName}!*\n` +
            `Your product was not added to the database because it is missing important information:\n\n` +
            missingReasons + `\n` +
            `Your trust score has been lowered by 1 point because this post is incomplete.\n` +
            `*Please repost in your channel with the missing details to list your product.*`,
            { 
              parse_mode: 'Markdown' 
            }
          ).catch(console.error);
        } else {
          // Acknowledge the successful save directly to the admin
          const savedProduct = await ctx.telegram.sendMessage(
            seller.user.telegramId.toString(),
            `✅ *Product Listed Successfully!*\n` +
            `📦 *${parsedProduct.title}* added at *${parsedProduct.price.toLocaleString()} ETB*\n\n` +
            `💡 *Set Your Secret Minimum Price*\n` +
            `What is the lowest price you are willing to accept for this product?\n` +
            `This price stays completely secret from buyers.\n\n` +
            `➡️ Reply with a number (e.g. *38000*) to set your floor price.\n` +
            `If you skip this, the system defaults to *85%* of your listing price.`,
            { parse_mode: 'Markdown' }
          ).catch(console.error);

          // Mark this seller as awaiting a minPrice reply for the product just created
          // We need the product id — re-fetch it by title and sellerId (most recent match)
          const justCreated = await prisma.product.findFirst({
            where: { sellerId: seller.id, title: parsedProduct.title },
            orderBy: { createdAt: 'desc' }
          }).catch(() => null);

          if (justCreated) {
            pendingMinPrice.set(seller.user.telegramId.toString(), justCreated.id);
            console.log(`[ChannelPost] Awaiting minPrice from seller ${seller.user.telegramId} for product ${justCreated.id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing channel post:', error);
    }
  });
}
