import { Telegraf, Context } from 'telegraf';
import { parseProductFromText, saveProduct } from '../flows/sellerFlow/mocks';

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
      await saveProduct({
        sellerId: ctx.chat.id.toString(), // Mock seller ID from channel ID
        title: parsedProduct.title,
        description: parsedProduct.description,
        price: parsedProduct.price,
        condition: parsedProduct.condition,
        category: parsedProduct.category,
        imageUrl: photoId,
      });
      console.log(`Product saved from channel post in ${ctx.chat.id}`);
    } catch (error) {
      console.error('Error processing channel post:', error);
    }
  });
}
