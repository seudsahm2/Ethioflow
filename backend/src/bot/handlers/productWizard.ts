/**
 * Product Listing Wizard
 *
 * Drives the interactive, button-first product posting flow for registered sellers.
 *
 * Flow:
 *   "📦 Post a Product" button
 *     → pick category (inline keyboard)
 *     → title  (text)
 *     → description  (text)
 *     → price  (text, validated)
 *     → min price  (text, validated)
 *     → image  (photo or "⏭ Skip" button)
 *     → category-specific fields  (choice or text, one at a time)
 *     → confirmation card  ("✅ Post & Forward" / "✏️ Edit" / "❌ Cancel")
 *
 * After confirmation the product is saved to the DB and a formatted post
 * (with "🤝 Negotiate" button) is sent to the seller's registered channel.
 */

import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/types';
import { PrismaClient } from '@prisma/client';
import {
  productWizardSessions,
  ProductListingSession,
  CATEGORIES,
  CategoryField,
} from '../state';
import { createProduct } from '../../core/services/productService';
import { uploadToPublicHost } from '../../core/utils/imageUpload';

const prisma = new PrismaClient();

// ─── Reply-keyboard helpers ──────────────────────────────────────────────────

const DEFAULT_KEYBOARD = {
  keyboard: [['📦 Post a Product', '🔍 Search']],
  resize_keyboard: true,
  persistent: true,
};

const CANCEL_KEYBOARD = {
  keyboard: [['❌ Cancel Listing']],
  resize_keyboard: true,
  persistent: true,
};

// ─── Exported helper: start the wizard (used by both button handler + /post command) ──

export async function startWizard(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  const seller = await prisma.seller.findFirst({
    where: { user: { telegramId: BigInt(telegramId) } },
  });

  if (!seller) {
    await ctx.reply(
      `⚠️ *You're not registered as a seller yet.*\n\n` +
      `To register, simply *add this bot as an Administrator* to your Telegram channel. ` +
      `Once done, tap "📦 Post a Product" again.`,
      { parse_mode: 'Markdown', reply_markup: DEFAULT_KEYBOARD },
    );
    return;
  }

  const newSession: ProductListingSession = {
    step: 'CATEGORY',
    category: '',
    title: '',
    description: '',
    price: 0,
    isFixedPrice: false,
    minPrice: 0,
    specificFields: {},
    pendingSpecificFields: [],
  };
  productWizardSessions.set(telegramId, newSession);

  await ctx.reply(
    `🛍️ *Let's list a new product!*\n\nYou can tap *❌ Cancel Listing* at any time to stop.`,
    { parse_mode: 'Markdown', reply_markup: CANCEL_KEYBOARD },
  );
  await sendCategoryPicker(ctx);
}

// ─── Wizard helpers ──────────────────────────────────────────────────────────

function getCategoryDef(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

function buildConfirmationText(session: ProductListingSession): string {
  const catDef = getCategoryDef(session.category);
  const catLabel = catDef ? `${catDef.emoji} ${catDef.label}` : session.category;

  let extra = '';
  if (Object.keys(session.specificFields).length > 0) {
    extra = '\n' + Object.entries(session.specificFields)
      .map(([k, v]) => {
        const fieldDef = catDef?.fields.find((f) => f.key === k);
        return `• *${fieldDef?.label ?? k}:* ${v}`;
      })
      .join('\n');
  }

  const pricingLine = session.isFixedPrice
    ? `💰 *Price:* ${session.price.toLocaleString()} ETB  🔒 *Fixed — no haggling*`
    : `💰 *Price:* ${session.price.toLocaleString()} ETB  🤝 *Negotiable*\n🔐 *Secret Min:* ${session.minPrice.toLocaleString()} ETB`;

  return (
    `📋 *Product Summary — Please Review*\n\n` +
    `📂 *Category:* ${catLabel}\n` +
    `🏷️ *Title:* ${session.title}\n` +
    `📝 *Description:* ${session.description}\n` +
    pricingLine + `\n` +
    `🖼️ *Image:* ${session.imageUrl ? '✅ Uploaded' : '❌ No image'}\n` +
    extra +
    `\n\nDoes everything look correct?`
  );
}

function buildChannelPostText(session: ProductListingSession, botUsername: string, productId: string): string {
  const catDef = getCategoryDef(session.category);
  const catLabel = catDef ? `${catDef.emoji} ${catDef.label}` : session.category;

  let extra = '';
  if (Object.keys(session.specificFields).length > 0) {
    extra = '\n' + Object.entries(session.specificFields)
      .map(([k, v]) => {
        const fieldDef = catDef?.fields.find((f) => f.key === k);
        return `• *${fieldDef?.label ?? k}:* ${v}`;
      })
      .join('\n');
  }

  const priceBadge = session.isFixedPrice
    ? `💰 *Price:* ${session.price.toLocaleString()} ETB  🔒 _(Fixed Price)_`
    : `💰 *Price:* ${session.price.toLocaleString()} ETB  🤝 _(Negotiable)_`;

  const ctaLine = session.isFixedPrice
    ? `\n\n📲 _Price is fixed. Tap below to discuss delivery, bundling & terms._`
    : `\n\n📲 _Tap below to negotiate the price directly with the seller._`;

  return (
    `🛍️ *${session.title}*\n\n` +
    `📂 *Category:* ${catLabel}\n` +
    priceBadge + `\n` +
    `📝 ${session.description}\n` +
    extra +
    ctaLine
  );
}

// ─── Step prompt senders ─────────────────────────────────────────────────────

async function sendCategoryPicker(ctx: Context): Promise<void> {
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    const row = CATEGORIES.slice(i, i + 2).map((c) => ({
      text: `${c.emoji} ${c.label}`,
      callback_data: `wiz_cat:${c.id}`,
    }));
    rows.push(row);
  }
  await ctx.reply('*Step 1 of many — Choose a category:*', {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: rows },
  });
}

async function sendFieldPrompt(ctx: Context, session: ProductListingSession): Promise<void> {
  const fieldKey = session.pendingSpecificFields[0];
  const catDef = getCategoryDef(session.category);
  const fieldDef = catDef?.fields.find((f) => f.key === fieldKey);
  if (!fieldDef) return;

  const label = `${fieldDef.optional ? '_(optional)_ ' : ''}\`${fieldDef.label}\``;

  if (fieldDef.type === 'choice' && fieldDef.options) {
    const rows = fieldDef.options.map((opt) => [
      { text: opt, callback_data: `wiz_field:${fieldKey}:${opt}` },
    ]);
    if (fieldDef.optional) {
      rows.push([{ text: '⏭ Skip', callback_data: `wiz_field:${fieldKey}:__skip__` }]);
    }
    await ctx.reply(`*${fieldDef.label}:*`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: rows },
    });
  } else {
    const skipRow = fieldDef.optional
      ? [[{ text: '⏭ Skip', callback_data: `wiz_field:${fieldKey}:__skip__` }]]
      : [];
    await ctx.reply(`Please type the *${fieldDef.label}*:`, {
      parse_mode: 'Markdown',
      reply_markup: skipRow.length > 0 ? { inline_keyboard: skipRow } : undefined,
    });
  }
}

async function sendConfirmation(ctx: Context, session: ProductListingSession): Promise<void> {
  const text = buildConfirmationText(session);
  const markup = {
    inline_keyboard: [
      [
        { text: '✅ Post & Forward to Channel', callback_data: 'wiz_confirm' },
      ],
      [
        { text: '❌ Cancel', callback_data: 'wiz_cancel' },
      ],
    ],
  };

  if (session.imageUrl) {
    await ctx.replyWithPhoto(session.imageUrl, {
      caption: text,
      parse_mode: 'Markdown',
      reply_markup: markup,
    });
  } else {
    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup });
  }
}

// ─── Step advancer ───────────────────────────────────────────────────────────

async function advanceStep(ctx: Context, session: ProductListingSession, telegramId: string): Promise<void> {
  switch (session.step) {
    case 'CATEGORY':
      session.step = 'TITLE';
      await ctx.reply('*Step 2 — What is the product title/name?*', {
        parse_mode: 'Markdown',
        reply_markup: CANCEL_KEYBOARD,
      });
      break;

    case 'TITLE':
      session.step = 'DESCRIPTION';
      await ctx.reply('*Step 3 — Write a short description of the product:*', {
        parse_mode: 'Markdown',
        reply_markup: CANCEL_KEYBOARD,
      });
      break;

    case 'DESCRIPTION':
      session.step = 'PRICE';
      await ctx.reply('*Step 4 — What is the listing price? (ETB, numbers only)*', {
        parse_mode: 'Markdown',
        reply_markup: CANCEL_KEYBOARD,
      });
      break;

    case 'PRICE':
      session.step = 'PRICING_TYPE';
      await ctx.reply(
        `*Step 5 — Pricing type for this item:*\n\n` +
        `🔒 *Fixed Price* — The price is final. Buyers can discuss delivery & terms but cannot negotiate the price.\n\n` +
        `🤝 *Negotiable* — Buyers can negotiate the price down. You will set a secret minimum floor they never see.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔒 Fixed Price', callback_data: 'wiz_pricing:fixed' }],
              [{ text: '🤝 Negotiable', callback_data: 'wiz_pricing:negotiable' }],
            ],
          },
        },
      );
      break;

    case 'PRICING_TYPE':
      if (session.isFixedPrice) {
        // Skip MIN_PRICE entirely
        session.step = 'IMAGE';
        await ctx.reply(
          '*Step 6 — Send a product photo, or skip:*',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '⏭ Skip Photo', callback_data: 'wiz_skip_image' }]],
            },
          },
        );
      } else {
        session.step = 'MIN_PRICE';
        await ctx.reply(
          `*Step 6 — Secret minimum price (ETB)*\n\n` +
          `This is the lowest you will ever accept. Buyers never see this. ` +
          `Must be below your listing price of *${session.price.toLocaleString()} ETB*.`,
          { parse_mode: 'Markdown', reply_markup: CANCEL_KEYBOARD },
        );
      }
      break;

    case 'MIN_PRICE':
      session.step = 'IMAGE';
      await ctx.reply(
        '*Step 7 — Send a product photo, or skip:*',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '⏭ Skip Photo', callback_data: 'wiz_skip_image' }]],
          },
        },
      );
      break;

    case 'IMAGE':
      // If there are specific fields for this category, start collecting them
      if (session.pendingSpecificFields.length > 0) {
        session.step = 'SPECIFIC_FIELDS';
        await sendFieldPrompt(ctx, session);
      } else {
        session.step = 'CONFIRM';
        await sendConfirmation(ctx, session);
      }
      break;

    case 'SPECIFIC_FIELDS':
      if (session.pendingSpecificFields.length > 0) {
        await sendFieldPrompt(ctx, session);
      } else {
        session.step = 'CONFIRM';
        await sendConfirmation(ctx, session);
      }
      break;

    default:
      break;
  }

  productWizardSessions.set(telegramId, session);
}

// ─── Cancel / cleanup ─────────────────────────────────────────────────────────

async function cancelWizard(ctx: Context, telegramId: string, message = '❌ *Listing cancelled.* No product was posted.'): Promise<void> {
  productWizardSessions.delete(telegramId);
  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: DEFAULT_KEYBOARD,
  });
}

// ─── Main setup function ──────────────────────────────────────────────────────

export function setupProductWizardHandler(bot: Telegraf<Context>): void {

  // ── Callback: pricing type selected ──────────────────────────────────────
  bot.action(/^wiz_pricing:(fixed|negotiable)$/, async (ctx) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;
    const session = productWizardSessions.get(telegramId);
    if (!session || session.step !== 'PRICING_TYPE') return;

    const choice = ctx.match[1];
    session.isFixedPrice = choice === 'fixed';

    await ctx.answerCbQuery(choice === 'fixed' ? '🔒 Fixed Price selected' : '🤝 Negotiable selected');
    try { await ctx.deleteMessage(); } catch {}

    await advanceStep(ctx, session, telegramId);
  });

  // ── Callback: category selected ──────────────────────────────────────────
  bot.action(/^wiz_cat:(.+)$/, async (ctx) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;
    const session = productWizardSessions.get(telegramId);
    if (!session || session.step !== 'CATEGORY') return;

    const catId = ctx.match[1];
    const catDef = getCategoryDef(catId);
    if (!catDef) return;

    session.category = catId;
    session.pendingSpecificFields = catDef.fields.map((f) => f.key);

    await ctx.answerCbQuery(`${catDef.emoji} ${catDef.label} selected`);
    try { await ctx.deleteMessage(); } catch {}

    await advanceStep(ctx, session, telegramId);
  });

  // ── Callback: specific field answered (choice type) ──────────────────────
  bot.action(/^wiz_field:([^:]+):(.+)$/, async (ctx) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;
    const session = productWizardSessions.get(telegramId);
    if (!session || session.step !== 'SPECIFIC_FIELDS') return;

    const fieldKey = ctx.match[1];
    const value = ctx.match[2];

    if (session.pendingSpecificFields[0] !== fieldKey) return;

    await ctx.answerCbQuery(value === '__skip__' ? 'Skipped' : `✅ ${value}`);
    try { await ctx.deleteMessage(); } catch {}

    // Save value (skip → don't store)
    if (value !== '__skip__') {
      session.specificFields[fieldKey] = value;
    }
    session.pendingSpecificFields.shift();

    await advanceStep(ctx, session, telegramId);
  });

  // ── Callback: skip image ─────────────────────────────────────────────────
  bot.action('wiz_skip_image', async (ctx) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;
    const session = productWizardSessions.get(telegramId);
    if (!session || session.step !== 'IMAGE') return;

    await ctx.answerCbQuery('Photo skipped');
    try { await ctx.deleteMessage(); } catch {}

    await advanceStep(ctx, session, telegramId);
  });

  // ── Callback: confirm & post ─────────────────────────────────────────────
  bot.action('wiz_confirm', async (ctx) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;
    const session = productWizardSessions.get(telegramId);
    if (!session || session.step !== 'CONFIRM') return;

    await ctx.answerCbQuery('⏳ Posting...');
    try { await ctx.deleteMessage(); } catch {}

    // Look up the seller
    const seller = await prisma.seller.findFirst({
      where: { user: { telegramId: BigInt(telegramId) } },
      include: { user: true },
    });

    if (!seller) {
      await ctx.reply(
        '⚠️ *You are not registered as a seller.*\n\nAdd this bot as an admin to your Telegram channel first, then try again.',
        { parse_mode: 'Markdown', reply_markup: DEFAULT_KEYBOARD },
      );
      productWizardSessions.delete(telegramId);
      return;
    }

    // Build description string: base description + specific fields appended
    const catDef = getCategoryDef(session.category);
    let fullDescription = session.description;
    if (Object.keys(session.specificFields).length > 0) {
      const extras = Object.entries(session.specificFields)
        .map(([k, v]) => {
          const fDef = catDef?.fields.find((f) => f.key === k);
          return `${fDef?.label ?? k}: ${v}`;
        })
        .join(' | ');
      fullDescription += `\n\n${extras}`;
    }

    // Extract condition from specific fields if present (used for DB field)
    const condition = session.specificFields['condition'] ?? 'Not specified';

    // Save to DB
    const product = await createProduct(seller.id, {
      title: session.title,
      description: fullDescription,
      price: session.price,
      isFixedPrice: session.isFixedPrice,
      // For fixed price: minPrice = price (set automatically in createProduct)
      minPrice: session.isFixedPrice ? session.price : session.minPrice,
      condition,
      category: catDef?.label ?? session.category,
      imageUrl: session.imageUrl,
      isDraft: false,
    });

    // Build channel post
    const botUsername = ctx.botInfo?.username ?? '';
    const postText = buildChannelPostText(session, botUsername, product.id);
    const negotiateUrl = `https://t.me/${botUsername}?start=neg_${product.id}`;
    const replyMarkup = {
      inline_keyboard: [[{ text: '🤝 Negotiate with Seller', url: negotiateUrl }]],
    };

    // Send post to the seller's channel
    try {
      if (session.imageUrl) {
        await ctx.telegram.sendPhoto(seller.channelId.toString(), session.imageUrl, {
          caption: postText,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        });
      } else {
        await ctx.telegram.sendMessage(seller.channelId.toString(), postText, {
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        });
      }

      productWizardSessions.delete(telegramId);

      await ctx.reply(
        `✅ *Product listed successfully!*\n\n` +
        `📦 *${session.title}* has been saved to the marketplace and posted to *${seller.channelName}*.\n\n` +
        `Buyers can now find and negotiate for it! 🎉`,
        { parse_mode: 'Markdown', reply_markup: DEFAULT_KEYBOARD },
      );
    } catch (err: any) {
      console.error('[Wizard] Failed to post to channel:', err?.message);
      await ctx.reply(
        `⚠️ *Product saved to database, but posting to the channel failed.*\n\nError: ${err?.message ?? 'Unknown'}\n\nCheck that this bot is still an admin in your channel.`,
        { parse_mode: 'Markdown', reply_markup: DEFAULT_KEYBOARD },
      );
      productWizardSessions.delete(telegramId);
    }
  });

  // ── Callback: cancel from confirmation ───────────────────────────────────
  bot.action('wiz_cancel', async (ctx) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;
    await ctx.answerCbQuery('Cancelled');
    try { await ctx.deleteMessage(); } catch {}
    await cancelWizard(ctx, telegramId);
  });

  // ── Text handler: all wizard text input + menu button triggers ───────────
  bot.on('text', async (ctx, next) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return next();

    const text = ctx.message.text.trim();

    // ── Menu button: "📦 Post a Product" ────────────────────────────────
    if (text === '📦 Post a Product') {
      // Check the user is a registered seller
      const seller = await prisma.seller.findFirst({
        where: { user: { telegramId: BigInt(telegramId) } },
      });

      if (!seller) {
        await ctx.reply(
          `⚠️ *You're not registered as a seller yet.*\n\n` +
          `To register, simply *add this bot as an Administrator* to your Telegram channel. ` +
          `Once done, tap "📦 Post a Product" again.`,
          { parse_mode: 'Markdown', reply_markup: DEFAULT_KEYBOARD },
        );
        return;
      }

      // Start a fresh session
      const newSession: ProductListingSession = {
        step: 'CATEGORY',
        category: '',
        title: '',
        description: '',
        price: 0,
        isFixedPrice: false,
        minPrice: 0,
        specificFields: {},
        pendingSpecificFields: [],
      };
      productWizardSessions.set(telegramId, newSession);

      await ctx.reply(
        `🛍️ *Let's list a new product!*\n\nYou can type *❌ Cancel Listing* at any time to stop.`,
        { parse_mode: 'Markdown', reply_markup: CANCEL_KEYBOARD },
      );
      await sendCategoryPicker(ctx);
      return;
    }

    // ── Menu button: "❌ Cancel Listing" ─────────────────────────────────
    if (text === '❌ Cancel Listing') {
      if (productWizardSessions.has(telegramId)) {
        await cancelWizard(ctx, telegramId);
      } else {
        await ctx.reply('No active listing to cancel.', { reply_markup: DEFAULT_KEYBOARD });
      }
      return;
    }

    // ── Active wizard: collect text answers ──────────────────────────────
    const session = productWizardSessions.get(telegramId);
    if (!session) return next();

    // Don't consume slash commands
    if (text.startsWith('/')) return next();

    switch (session.step) {
      case 'TITLE': {
        if (text.length < 3) {
          await ctx.reply('⚠️ Title is too short. Please enter at least 3 characters:');
          return;
        }
        session.title = text;
        await advanceStep(ctx, session, telegramId);
        return;
      }

      case 'DESCRIPTION': {
        session.description = text;
        await advanceStep(ctx, session, telegramId);
        return;
      }

      case 'PRICE': {
        const price = parseFloat(text.replace(/,/g, ''));
        if (isNaN(price) || price <= 0) {
          await ctx.reply('⚠️ Please enter a valid positive number (e.g. *15000*).', { parse_mode: 'Markdown' });
          return;
        }
        session.price = price;
        await advanceStep(ctx, session, telegramId);
        return;
      }

      case 'MIN_PRICE': {
        const minPrice = parseFloat(text.replace(/,/g, ''));
        if (isNaN(minPrice) || minPrice <= 0) {
          await ctx.reply('⚠️ Please enter a valid positive number.', { parse_mode: 'Markdown' });
          return;
        }
        if (minPrice >= session.price) {
          await ctx.reply(
            `⚠️ Secret minimum must be *below* your listing price of *${session.price.toLocaleString()} ETB*. Try again:`,
            { parse_mode: 'Markdown' },
          );
          return;
        }
        session.minPrice = minPrice;
        await advanceStep(ctx, session, telegramId);
        return;
      }

      case 'SPECIFIC_FIELDS': {
        // Only handle text-type fields here; choice fields are handled via callbacks
        const fieldKey = session.pendingSpecificFields[0];
        if (!fieldKey) break;
        const catDef = getCategoryDef(session.category);
        const fieldDef = catDef?.fields.find((f) => f.key === fieldKey);
        if (!fieldDef || fieldDef.type !== 'text') break;

        session.specificFields[fieldKey] = text;
        session.pendingSpecificFields.shift();
        await advanceStep(ctx, session, telegramId);
        return;
      }

      default:
        break;
    }

    return next();
  });

  // ── Photo handler: collect image during IMAGE step ───────────────────────
  bot.on('photo', async (ctx, next) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return next();

    const session = productWizardSessions.get(telegramId);
    if (!session || session.step !== 'IMAGE') return next();

    const photos = ctx.message.photo;
    const largest = photos[photos.length - 1];

    await ctx.reply('📤 *Uploading your image…*', { parse_mode: 'Markdown' });

    try {
      const fileLink = await ctx.telegram.getFileLink(largest.file_id);
      const response = await fetch(fileLink.toString());
      const buffer = Buffer.from(await response.arrayBuffer());
      const publicUrl = await uploadToPublicHost(buffer, `${largest.file_id}.jpg`);

      if (publicUrl) {
        session.imageUrl = publicUrl;
        await ctx.reply('✅ Image uploaded!');
      } else {
        await ctx.reply('⚠️ Image upload failed — continuing without image.');
      }
    } catch (err) {
      console.error('[Wizard] Image upload error:', err);
      await ctx.reply('⚠️ Could not process image — continuing without image.');
    }

    await advanceStep(ctx, session, telegramId);
  });
}
