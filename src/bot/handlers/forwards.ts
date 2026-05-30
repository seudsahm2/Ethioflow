import { Telegraf, Context } from 'telegraf';
import { parseProductFromText, saveProduct } from '../flows/sellerFlow/mocks';

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
        
        await saveProduct({
          sellerId: ctx.from.id.toString(), // Mock seller ID from DM user
          title: parsedProduct.title,
          description: parsedProduct.description,
          price: parsedProduct.price,
          condition: parsedProduct.condition,
          category: parsedProduct.category,
          imageUrl: photoId,
        });

        await ctx.reply('Successfully parsed and saved the forwarded product!');
      } catch (error) {
        console.error('Error processing forwarded message:', error);
        await ctx.reply('Failed to process the forwarded message.');
      }
    }
  });
}
