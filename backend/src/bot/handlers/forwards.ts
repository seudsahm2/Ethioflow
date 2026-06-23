import { Telegraf, Context } from 'telegraf';
import { createProduct } from '../../core/services/productService';
// @ts-ignore: TM1 hasn't exported this yet
import { parseProductFromText } from '../../core/ai';

export function setupForwardsHandler(bot: Telegraf<Context>) {
  bot.on('message', async (ctx) => {
    const message = ctx.message;
    
    // Check if the message is forwarded and it's a private chat
    if (ctx.chat.type === 'private' && ('forward_origin' in message || 'forward_date' in message)) {
      let text = '';
      let photoId: string | undefined;

      if ('text' in message) {
        text = message.text;
      } else if ('caption' in message) {
        text = message.caption || '';
      }

      if ('photo' in message && message.photo.length > 0) {
        const largestPhoto = message.photo[message.photo.length - 1];
        photoId = largestPhoto.file_id;
      }

      if (!text) {
        await ctx.reply('Please forward a message that contains text or a caption so I can extract product details.');
        return;
      }

      try {
        const parsedProduct = await parseProductFromText(text);
        
        if (parsedProduct) {
          (parsedProduct as any).imageUrl = photoId;
          await createProduct(ctx.from.id.toString(), parsedProduct);
        }

        await ctx.reply('Successfully parsed and saved the forwarded product!');
      } catch (error) {
        console.error('Error processing forwarded message:', error);
        await ctx.reply('Failed to process the forwarded message.');
      }
    }
  });
}
