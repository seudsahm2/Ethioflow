import { Telegraf, Context } from 'telegraf';
import { createProduct } from '../../core/services/productService';
import { parseProductFromText } from '../../core/ai';
import { PrismaClient } from '@prisma/client';
import { pendingMinPrice } from '../state';

const prisma = new PrismaClient();

// In-memory cache for grouping media albums
// Telegram sends a separate event for each photo in an album, but they share the same media_group_id
const mediaGroupCache: Record<string, {
  fileIds: string[];
  text: string;
  messageId: number;
  chatId: number;
  timer: NodeJS.Timeout;
}> = {};

export function setupChannelHandlers(bot: Telegraf<Context>) {
  bot.on('channel_post', async (ctx) => {
    const post = ctx.channelPost;
    
    let text = '';
    let fileId: string | undefined;

    // Extract text/caption
    if ('text' in post) {
      text = post.text;
    } else if ('caption' in post) {
      text = post.caption || '';
    }

    // Extract highest resolution photo file_id
    if ('photo' in post && post.photo.length > 0) {
      const largestPhoto = post.photo[post.photo.length - 1];
      fileId = largestPhoto.file_id;
    }

    const mediaGroupId = 'media_group_id' in post ? post.media_group_id : undefined;

    // If it's part of an album, cache it temporarily to group all photos together
    if (mediaGroupId && fileId) {
      if (!mediaGroupCache[mediaGroupId]) {
        // First photo of the album received, start a 2.5 second timer
        mediaGroupCache[mediaGroupId] = {
          fileIds: [],
          text: '',
          messageId: post.message_id,
          chatId: ctx.chat.id,
          timer: setTimeout(() => processMediaGroup(ctx, mediaGroupId), 2500)
        };
      }
      
      // Add this photo to the group
      mediaGroupCache[mediaGroupId].fileIds.push(fileId);
      
      // Usually only one photo in the group has the caption, save it when we find it
      if (text) {
        mediaGroupCache[mediaGroupId].text = text;
      }
      
      return; // Handled by the timer when the album finishes uploading
    }

    // If it's a single photo or text-only post
    if (!text && !fileId) return;

    await processProductData(ctx, ctx.chat.id, text, fileId ? [fileId] : [], post.message_id, undefined);
  });
}

async function processMediaGroup(ctx: Context, mediaGroupId: string) {
  const group = mediaGroupCache[mediaGroupId];
  if (!group) return;
  
  // Clear from cache
  delete mediaGroupCache[mediaGroupId];

  if (!group.text) {
    console.log(`Media group ${mediaGroupId} has no caption. Skipping product creation.`);
    return;
  }

  await processProductData(ctx, group.chatId, group.text, group.fileIds, group.messageId, mediaGroupId);
}

async function processProductData(
  ctx: Context, 
  chatId: number,
  text: string, 
  telegramFileIds: string[], 
  messageId: number,
  mediaGroupId?: string
) {
  // We need both text (for product details) and at least one image
  if (!text) return;
  if (telegramFileIds.length === 0) {
    console.log(`Post in channel ${chatId} has no images. Skipping.`);
    return;
  }

  try {
    const seller = await prisma.seller.findUnique({
      where: { channelId: BigInt(chatId) },
      include: { user: true }
    });

    if (!seller) {
      console.log(`Channel ${chatId} not registered as a seller. Skipping post.`);
      return;
    }

    const parsedProduct = await parseProductFromText(text);
    
    if (parsedProduct) {
      const productData = {
        ...parsedProduct,
        telegramFileIds,
        messageId: BigInt(messageId),
        mediaGroupId
      };
      
      await createProduct(seller.id, productData);
      console.log(`Product saved from channel ${chatId} (seller: ${seller.channelName}). Draft: ${parsedProduct.isDraft}`);

      if (parsedProduct.isDraft && parsedProduct.missingFields) {
        await prisma.seller.update({
          where: { id: seller.id },
          data: { trustScore: { decrement: 1 } }
        }).catch(console.error);

        const missingArray = parsedProduct.missingFields.split(',');
        let missingReasons = '';
        if (missingArray.includes('title')) missingReasons += `❌ *Title:* We couldn't figure out the name of the product.\n`;
        if (missingArray.includes('price')) missingReasons += `❌ *Price:* You must explicitly state the price in ETB.\n`;
        
        if (!missingReasons) {
          missingReasons = `❌ *Missing Data:* ${parsedProduct.missingFields}\n`;
        }

        await ctx.telegram.sendMessage(
          seller.user.telegramId.toString(),
          `⚠️ *Post Rejected in ${seller.channelName}!*\n` +
          `Your product was not added to the database because it is missing important information:\n\n` +
          missingReasons + `\n` +
          `Your trust score has been lowered by 1 point because this post is incomplete.\n` +
          `*Please repost in your channel with the missing details to list your product.*`,
          { parse_mode: 'Markdown' }
        ).catch(console.error);
      } else {
        const savedProductMessage = await ctx.telegram.sendMessage(
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

        const justCreated = await prisma.product.findFirst({
          where: { sellerId: seller.id, title: parsedProduct.title },
          orderBy: { createdAt: 'desc' }
        }).catch(() => null);

        if (justCreated) {
          pendingMinPrice.set(seller.user.telegramId.toString(), justCreated.id);
        }
      }
    }
  } catch (error) {
    console.error('Error processing channel post:', error);
  }
}
