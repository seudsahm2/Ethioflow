import { Telegraf, Context } from 'telegraf';
import { createProduct } from '../../core/services/productService';
// @ts-ignore: TM1 hasn't exported this yet
import { parseProductFromText } from '../../core/ai';

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
      photoId = largestPhoto.file_id;
    }

    if (!text) {
      // If there's no text/caption, we might not be able to parse product info.
      return;
    }

    try {
      const parsedProduct = await parseProductFromText(text);
      
      // Save product to DB
      if (parsedProduct) {
        (parsedProduct as any).imageUrl = photoId; // Attach photo if any
        await createProduct(ctx.chat.id.toString(), parsedProduct);
        console.log(`Product saved from channel post in ${ctx.chat.id}`);
      }
    } catch (error) {
      console.error('Error processing channel post:', error);
    }
  });
}
