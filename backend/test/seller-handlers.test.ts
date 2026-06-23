import { Telegraf, Context } from 'telegraf';
import { setupMyChatMemberHandler } from '../src/bot/handlers/myChatMember';
import { setupChannelHandlers } from '../src/bot/handlers/channelPost';
import { setupForwardsHandler } from '../src/bot/handlers/forwards';

// Mock dependencies
jest.mock('../src/core/services/sellerService', () => ({
  SellerService: {
    registerSeller: jest.fn().mockResolvedValue(true)
  }
}));
jest.mock('../src/core/services/productService', () => ({
  createProduct: jest.fn().mockResolvedValue(true)
}));
jest.mock('../src/core/ai', () => ({
  parseProductFromText: jest.fn().mockResolvedValue({
    title: 'Test Product',
    price: 500,
    condition: 'Used',
    description: 'A test product',
    category: 'Electronics'
  })
}));

import { SellerService } from '../src/core/services/sellerService';
import { createProduct } from '../src/core/services/productService';
// @ts-ignore
import { parseProductFromText } from '../src/core/ai';

describe('Seller Handlers', () => {
  let bot: Telegraf<Context>;

  beforeEach(() => {
    bot = new Telegraf('mock-token');
    bot.telegram.callApi = jest.fn().mockResolvedValue(true);
    bot.telegram.sendMessage = jest.fn().mockResolvedValue(true);
    bot.botInfo = {
      id: 12345,
      is_bot: true,
      first_name: 'Mock Bot',
      username: 'mock_bot',
      can_join_groups: true,
      can_read_all_group_messages: true,
      supports_inline_queries: false
    };
    jest.clearAllMocks();
  });

  test('should register seller on my_chat_member', async () => {
    setupMyChatMemberHandler(bot);

    // Simulate my_chat_member update
    await bot.handleUpdate({
      update_id: 1,
      my_chat_member: {
        chat: { id: -1001234567890, type: 'channel', title: 'My Awesome Channel' },
        from: { id: 123, is_bot: false, first_name: 'Seller' },
        date: 123456,
        old_chat_member: { status: 'left', user: { id: 999, is_bot: true, first_name: 'bot' } },
        new_chat_member: { status: 'administrator', user: { id: 999, is_bot: true, first_name: 'bot' } }
      }
    } as any);

    expect(SellerService.registerSeller).toHaveBeenCalledWith('123', '-1001234567890', 'My Awesome Channel');
  });

  test('should not register if not channel or not administrator', async () => {
    setupMyChatMemberHandler(bot);

    await bot.handleUpdate({
      update_id: 2,
      my_chat_member: {
        chat: { id: -1001234567890, type: 'channel', title: 'My Awesome Channel' },
        from: { id: 123, is_bot: false, first_name: 'Seller' },
        date: 123456,
        old_chat_member: { status: 'administrator', user: { id: 999, is_bot: true, first_name: 'bot' } },
        new_chat_member: { status: 'left', user: { id: 999, is_bot: true, first_name: 'bot' } } // Bot removed
      }
    } as any);

    expect(SellerService.registerSeller).not.toHaveBeenCalled();
  });

  test('should extract post and create product on channel_post', async () => {
    setupChannelHandlers(bot);

    await bot.handleUpdate({
      update_id: 3,
      channel_post: {
        message_id: 1,
        chat: { id: -1001234567890, type: 'channel', title: 'My Awesome Channel' },
        date: 123456,
        text: 'Selling my test product for 500',
        photo: [{ file_id: 'photo_id_1', width: 100, height: 100, file_size: 1000 }] // should extract photo
      }
    } as any);

    expect(parseProductFromText).toHaveBeenCalledWith('Selling my test product for 500');
    expect(createProduct).toHaveBeenCalledWith('-1001234567890', {
      title: 'Test Product',
      price: 500,
      condition: 'Used',
      description: 'A test product',
      category: 'Electronics',
      imageUrl: 'photo_id_1'
    });
  });

  test('should extract forwarded message and create product', async () => {
    // Inject middleware to mock reply
    bot.use((ctx, next) => {
      ctx.reply = jest.fn().mockResolvedValue(true);
      return next();
    });

    setupForwardsHandler(bot);

    await bot.handleUpdate({
      update_id: 4,
      message: {
        message_id: 2,
        date: 123456,
        chat: { id: 123, type: 'private' },
        from: { id: 123, is_bot: false, first_name: 'Seller' },
        forward_origin: { type: 'channel', chat: { id: -100123, type: 'channel', title: 'Test' }, date: 123 },
        caption: 'Selling my test product for 500',
        photo: [{ file_id: 'photo_id_2', width: 100, height: 100, file_size: 1000 }]
      }
    } as any);

    expect(parseProductFromText).toHaveBeenCalledWith('Selling my test product for 500');
    expect(createProduct).toHaveBeenCalledWith('123', {
      title: 'Test Product',
      price: 500,
      condition: 'Used',
      description: 'A test product',
      category: 'Electronics',
      imageUrl: 'photo_id_2'
    });
  });
});
