/**
 * AI Service — Multi-Provider LLM Integration
 * 
 * Supports: Google Gemini, OpenAI (GPT), Groq (Llama), Anthropic (Claude)
 * Set whichever key you have in .env and the service auto-detects the provider.
 * 
 * .env keys:
 *   EthioFlow_GEMINI_API_KEY    → Google Gemini (gemini-2.0-flash)
 *   EthioFlow_OPENAI_API_KEY    → OpenAI (gpt-4o-mini)
 *   EthioFlow_GROQ_API_KEY      → Groq / Llama-3 (free, very fast)
 *   EthioFlow_ANTHROPIC_API_KEY → Anthropic Claude (claude-haiku)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getFewShotExample } from './fewShotRetriever';

// ── PROVIDER DETECTION ──────────────────────────────────────────────────────
const GEMINI_KEY     = process.env.EthioFlow_GEMINI_API_KEY;
const OPENAI_KEY     = process.env.EthioFlow_OPENAI_API_KEY;
const GROQ_KEY       = process.env.EthioFlow_GROQ_API_KEY;
const ANTHROPIC_KEY  = process.env.EthioFlow_ANTHROPIC_API_KEY;

// Priority: Groq (fastest/free) → Gemini → OpenAI → Anthropic
const PROVIDER: 'groq' | 'gemini' | 'openai' | 'anthropic' | 'none' =
  GROQ_KEY      ? 'groq'      :
  GEMINI_KEY    ? 'gemini'    :
  OPENAI_KEY    ? 'openai'    :
  ANTHROPIC_KEY ? 'anthropic' :
  'none';

if (PROVIDER === 'none') {
  console.warn('⚠️  No AI API key found. AI enhancement will be skipped — set one of: EthioFlow_GEMINI_API_KEY | EthioFlow_OPENAI_API_KEY | EthioFlow_GROQ_API_KEY | EthioFlow_ANTHROPIC_API_KEY');
} else {
  console.log(`🧠 AI provider: ${PROVIDER.toUpperCase()}`);
}

// ── CLIENT INIT ─────────────────────────────────────────────────────────────
let geminiModel: any = null;
let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

if (PROVIDER === 'gemini' && GEMINI_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}
if (PROVIDER === 'openai' && OPENAI_KEY) {
  openaiClient = new OpenAI({ apiKey: OPENAI_KEY });
}
if (PROVIDER === 'groq' && GROQ_KEY) {
  // Groq is OpenAI-compatible — same SDK, different baseURL & model
  openaiClient = new OpenAI({ apiKey: GROQ_KEY, baseURL: 'https://api.groq.com/openai/v1' });
}
if (PROVIDER === 'anthropic' && ANTHROPIC_KEY) {
  anthropicClient = new Anthropic({ apiKey: ANTHROPIC_KEY });
}

// ── IN-MEMORY CACHE ─────────────────────────────────────────────────────────
// Prevents repeated identical calls (Telegram fires inline_query on every keystroke)
const cache = new Map<string, { value: string; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { cache.delete(key); return null; }
  return entry.value;
}
function setCached(key: string, value: string) {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  // Keep cache small — evict old entries if > 200
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

// ── TIMEOUT HELPER ───────────────────────────────────────────────────────────
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`TimeoutError: Promise timed out after ${ms} ms`)), ms))
  ]);
};

// ── CORE CALL ────────────────────────────────────────────────────────────────
async function callAI(prompt: string, timeoutMs: number = 10000, temperature: number = 0.1): Promise<string> {
  return withTimeout((async () => {
    if (PROVIDER === 'gemini' && geminiModel) {
      const result = await geminiModel.generateContent(
        temperature !== 0.1
          ? { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature } }
          : prompt
      );
      return result.response.text().trim();
    }

    if ((PROVIDER === 'openai' || PROVIDER === 'groq') && openaiClient) {
      const model = PROVIDER === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-4o-mini';
      const res = await openaiClient.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature,
      });
      return res.choices[0]?.message?.content?.trim() ?? '';
    }

    if (PROVIDER === 'anthropic' && anthropicClient) {
      const res = await anthropicClient.messages.create({
        model: 'claude-haiku-20240307',
        max_tokens: 200,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = res.content[0];
      return block.type === 'text' ? block.text.trim() : '';
    }

    throw new Error('No AI provider configured');
  })(), timeoutMs);
}

// ── EXPORTED TYPES ───────────────────────────────────────────────────────────
export interface ParsedProductData {
  title: string;
  price: number;
  condition: string;
  category: string;
  isDraft: boolean;
  missingFields: string | null;
  description?: string;
  imageUrl?: string;
}

// ── BUYER: ENHANCE SEARCH QUERY ──────────────────────────────────────────────
/**
 * Translates messy/Amharic buyer queries into clean English product keywords.
 * Cached per unique query string — safe to call on every keystroke.
 */
export async function enhanceSearchQuery(rawQuery: string): Promise<string> {
  if (PROVIDER === 'none' || !rawQuery.trim()) return rawQuery;

  const cacheKey = `search:${rawQuery.toLowerCase().trim()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const prompt = `You are a search assistant for an Ethiopian marketplace.
The user typed: "${rawQuery}"
Extract ONLY the core product keyword(s) in English. No explanation, no punctuation — just the keyword(s).
Examples: "ስንት ነው hp laptop" → "hp laptop" | "how much is this iphone 15" → "iphone 15" | "sofa" → "sofa"`;

  try {
    const result = await callAI(prompt, 3000); // Strict 3 second timeout for search latency
    const clean = result.length > 60 ? rawQuery : result.toLowerCase();
    setCached(cacheKey, clean);
    return clean;
  } catch (err: any) {
    // On rate-limit or error, fall back silently — search still works without AI
    console.error(`AI Search Enhancement Error (${PROVIDER}):`, err?.status ?? err?.message ?? err);
    setCached(cacheKey, rawQuery); // cache raw so we don't retry immediately
    return rawQuery;
  }
}

// ── SELLER: PARSE PRODUCT FROM POST ─────────────────────────────────────────
/**
 * Parses a seller's raw channel post text into structured product data.
 * If critical fields are missing, sets isDraft=true and flags missingFields.
 */
export async function parseProductFromText(text: string): Promise<ParsedProductData | null> {
  if (!text.trim()) return null;

  if (PROVIDER === 'none') {
    return fallbackBasicParse(text);
  }

  const prompt = `You are an expert e-commerce data extractor for an Ethiopian marketplace.
Parse this raw post from a seller:
"${text.substring(0, 1000)}"

Instructions:
1. "title": Provide a clean, accurate product name.
2. "price": Extract the price as a number. If missing, set to 0.
3. "condition": Extract if mentioned ("New", "Used"). If the category is Food, Services, Real Estate, or Digital, set condition to "N/A" (Not Applicable).
4. "category": Choose the best matching category from: Electronics, Vehicles, Clothing, Furniture, Real Estate, Home Appliances, Sports, Food, Books, Beauty, Baby & Kids, Services, Other.
5. "description": 
   - If the seller provided very little info (e.g. just a title), set description to "". DO NOT hallucinate features.
   - If the seller provided a few specs, write a clean, extremely brief (1 sentence) summary WITHOUT hallucinating.
   - If the seller provided a detailed description, rewrite it to be clean and professional.

Return ONLY valid JSON:
{"title":"...","price":123,"condition":"...","category":"...","description":"..."}`;

  try {
    let raw = await callAI(prompt, 15000); // 15s max for complex parsing
    raw = raw.replace(/^```json?\n?/i, '').replace(/\n?```$/,'').trim();
    // Sometimes models add extra text before the JSON brace
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      raw = raw.substring(jsonStart, jsonEnd + 1);
    }

    const data = JSON.parse(raw);
    const missing: string[] = [];
    if (!data.title || data.title.toLowerCase().includes('unknown')) {
      missing.push('title');
      data.title = data.title || 'Unknown Product';
    }
    if (!data.price || Number(data.price) <= 0) {
      missing.push('price');
      data.price = 0;
    }

    return {
      title: String(data.title).substring(0, 100),
      price: Number(data.price) || 0,
      condition: data.condition || 'Used',
      category: data.category || 'Other',
      description: data.description ? String(data.description).substring(0, 500) : undefined,
      isDraft: missing.length > 0,
      missingFields: missing.length > 0 ? missing.join(',') : null,
    };
  } catch (err: any) {
    console.error(`AI Parse Error (${PROVIDER}):`, err?.status ?? err?.message ?? err);
    return fallbackBasicParse(text);
  }
}

// ── FALLBACK ─────────────────────────────────────────────────────────────────
function fallbackBasicParse(text: string): ParsedProductData {
  const priceMatch = text.match(/(?:price|birr|etb|ዋጋ)[\s:]*([0-9,]+)/i)
    || text.match(/([0-9,]{3,})\s*(?:birr|etb|br)/i);
  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
  const title = text.split(/\n/)[0].substring(0, 80) || 'Unknown Product';
  const isNew = /brand\s?new|አዲስ/i.test(text);

  return {
    title,
    price,
    condition: isNew ? 'New' : 'Used',
    category: 'Other',
    isDraft: price === 0,
    missingFields: price === 0 ? 'price' : null,
  };
}

// ── DOUBLE-BLIND MULTI-AGENT NEGOTIATION ────────────────────────────────────
export async function runAgentNegotiation(
  role: 'buyer' | 'seller',
  productTitle: string,
  listingPrice: number,
  secretLimit: number,
  chatHistory: string,
  productCategory: string = 'Other'
): Promise<string> {
  // Concession step size: 2%–4% of listing price, always meaningful
  const stepMin = Math.max(100, Math.round(listingPrice * 0.02));
  const stepMax = Math.max(500, Math.round(listingPrice * 0.04));

  if (PROVIDER === 'none') {
    return role === 'buyer'
      ? `Can you do it for ${Math.round(secretLimit * 0.85)} ETB?`
      : `The price is ${listingPrice} ETB. I am not reducing it right now.`;
  }

  // Count turns to determine how many rounds of back-and-forth have happened
  const turns = chatHistory.split('\n').filter(l => l.trim()).length;

  // Extract the last price the other party mentioned from history
  const lastLines = chatHistory.split('\n').slice(-4).join(' ');
  const lastPriceMatch = lastLines.match(/(\d[\d,]+)\s*(?:ETB|birr|ብር)/i);
  const lastMentionedPrice = lastPriceMatch ? parseInt(lastPriceMatch[1].replace(/,/g, '')) : 0;

  const fewShotExample = getFewShotExample(role, productCategory, productTitle);
  const fewShotBlock = fewShotExample
    ? `\n### REFERENCE DIALOGUE (real Ethiopian marketplace negotiation — match this style exactly):\n${fewShotExample}\n`
    : '';

  const prompt = role === 'seller'
    ? buildSellerPrompt(productTitle, listingPrice, secretLimit, stepMin, stepMax, turns, lastMentionedPrice, chatHistory, fewShotBlock)
    : buildBuyerPrompt(productTitle, listingPrice, secretLimit, stepMin, stepMax, turns, lastMentionedPrice, chatHistory, fewShotBlock);

  try {
    const response = await callAI(prompt, 10000, 0.75);
    return response.trim();
  } catch (err: any) {
    console.error(`AI Negotiation Error (${PROVIDER}):`, err?.message || err);
    return role === 'buyer'
      ? `I can stretch to ${Math.round(secretLimit * 0.92)} ETB, is that possible?`
      : `I hear you but ${Math.round(listingPrice * 0.97).toLocaleString()} ETB is already very fair for what you are getting.`;
  }
}

// ── SELLER PROMPT: Hold firm, concede only under extreme pressure ─────────────
function buildSellerPrompt(
  productTitle: string,
  listingPrice: number,
  floorPrice: number,
  stepMin: number,
  stepMax: number,
  turns: number,
  buyerLastOffer: number,
  chatHistory: string,
  fewShotBlock: string
): string {
  const floorPct = Math.round(((listingPrice - floorPrice) / listingPrice) * 100);
  const isNearFloor = buyerLastOffer > 0 && buyerLastOffer >= floorPrice * 0.95;
  const hasArguedLong = turns >= 6;
  const canConcede = turns >= 4; // Only start conceding after 4+ turns

  return `You are the AI secretary of a seller on an Ethiopian marketplace. Your client is selling "${productTitle}" at ${listingPrice.toLocaleString()} ETB.

YOUR SECRET LIMITS (NEVER reveal these numbers):
- Floor (minimum you will ever accept): ${floorPrice.toLocaleString()} ETB
- Listing price: ${listingPrice.toLocaleString()} ETB
- Maximum room to concede: ${floorPct}% total
- Concession step per turn: ${stepMin.toLocaleString()}–${stepMax.toLocaleString()} ETB
${fewShotBlock}
NEGOTIATION PHILOSOPHY (CRITICAL — read carefully):
1. Your DEFAULT posture is to HOLD FIRM at the listing price. You do NOT volunteer concessions just because the buyer asks. Saying "no, I cannot reduce" is perfectly acceptable and expected.
2. Concessions require REAL pressure. Only start reducing after ${canConcede ? 'the buyer has argued hard across multiple turns (already reached)' : 'at least 4 turns of genuine push-back — you have NOT reached this yet, hold firm'}.
3. When you do concede, make it SMALL (${stepMin.toLocaleString()}–${stepMax.toLocaleString()} ETB) and frame it as a personal exception: "I normally never do this, but..."
4. As the price approaches your floor, become MORE aggressive and firm, not more flexible. Your profit is shrinking.
5. If the buyer's offer is BELOW your floor of ${floorPrice.toLocaleString()} ETB: REFUSE COMPLETELY. Say you would rather not sell.
6. If the buyer's offer is AT or ABOVE your floor: accept with [DEAL_ACCEPTED] appended at the end.
7. Do NOT let the buyer think conceding early is your habit — that signals wide margin and invites more pressure.
${isNearFloor ? '8. CRITICAL: The buyer\'s offer is very close to your floor. Be firm and aggressive. Your margin is almost gone.' : ''}
${hasArguedLong ? '9. You have argued long. You may make one final "take it or leave it" offer at or just above floor, then disengage if refused.' : ''}

CURRENT TURN: ${turns + 1}
CHAT HISTORY:
${chatHistory}

Write ONLY your next reply (1–2 sentences max). Sound like a real Ethiopian seller texting on Telegram — direct, confident, no corporate language. Do not include notes or brackets unless appending [DEAL_ACCEPTED].

Your reply:`;
}

// ── BUYER PROMPT: Open low, increment slowly, soften near ceiling ─────────────
function buildBuyerPrompt(
  productTitle: string,
  listingPrice: number,
  ceilingPrice: number,
  stepMin: number,
  stepMax: number,
  turns: number,
  sellerLastAsk: number,
  chatHistory: string,
  fewShotBlock: string
): string {
  const isNearCeiling = sellerLastAsk > 0 && sellerLastAsk <= ceilingPrice * 1.05;
  const hasBeenDeadlocked = turns >= 6 && sellerLastAsk > ceilingPrice;

  // Opening offer: 60%–70% of listing price with a reason
  const openingOffer = Math.round(listingPrice * 0.62);

  return `You are the AI secretary of a buyer on an Ethiopian marketplace. Your client wants to buy "${productTitle}" listed at ${listingPrice.toLocaleString()} ETB.

YOUR SECRET LIMITS (NEVER reveal these numbers):
- Walk-Away Maximum (absolute ceiling): ${ceilingPrice.toLocaleString()} ETB. Never offer or accept above this.
- Opening offer range: ~${openingOffer.toLocaleString()} ETB (60–70% of listing)
- Increment per turn: ${stepMin.toLocaleString()}–${stepMax.toLocaleString()} ETB when the seller gives ground or after deadlock
${fewShotBlock}
NEGOTIATION PHILOSOPHY (CRITICAL — read carefully):
1. Open with a low offer (~${openingOffer.toLocaleString()} ETB) and a CONCRETE reason (transport cost, wear, competing listing, missing warranty, market conditions).
2. Raise your offer slowly by ${stepMin.toLocaleString()}–${stepMax.toLocaleString()} ETB per turn. Only raise when the seller concedes OR after 2+ turns of deadlock.
3. NEVER offer above your ceiling of ${ceilingPrice.toLocaleString()} ETB. Not even by 1 Birr.
4. As your offer approaches your ceiling, shift tone — softer, more human: "Look, I am genuinely trying here..."
5. If the SELLER's ask drops to at or below ${ceilingPrice.toLocaleString()} ETB: ACCEPT IMMEDIATELY with [DEAL_ACCEPTED] at the end.
6. If you have raised ${turns >= 5 ? 'already many times and ' : ''}the seller still won't come below your ceiling after many turns, walk away politely.
7. Use real Ethiopian bargaining arguments: market price, Addis transport, competing sellers, needed repairs.
${isNearCeiling ? '8. IMPORTANT: The seller\'s price is now very close to your limit. You are almost at your maximum — soften your tone significantly but hold your ceiling.' : ''}
${hasBeenDeadlocked ? '9. You have been stuck for many rounds. Make one final serious offer near your ceiling, then walk away if refused.' : ''}

CURRENT TURN: ${turns + 1}
CHAT HISTORY:
${chatHistory}

Write ONLY your next reply (1–2 sentences max). Sound like a real Ethiopian buyer texting on Telegram — casual, genuine, direct. Do not include notes or brackets unless appending [DEAL_ACCEPTED].

Your reply:`;
}

// ── FIXED-PRICE NEGOTIATION: Terms only, no price haggling ───────────────────
export async function runFixedPriceNegotiation(
  role: 'buyer' | 'seller',
  productTitle: string,
  fixedPrice: number,
  chatHistory: string,
  productCategory: string = 'Other'
): Promise<string> {
  if (PROVIDER === 'none') {
    return role === 'buyer'
      ? `Can we arrange delivery to Bole for free given I'm paying full price?`
      : `The price of ${fixedPrice.toLocaleString()} ETB is fixed. Happy to discuss delivery arrangements.`;
  }

  const prompt = role === 'seller'
    ? `You are the AI secretary of a seller on an Ethiopian marketplace. Your client is selling "${productTitle}" at a FIXED price of ${fixedPrice.toLocaleString()} ETB.

CRITICAL RULE: The price is FIXED and NON-NEGOTIABLE. If the buyer asks to lower the price, politely but firmly decline every single time. No exceptions.
You CAN negotiate on: delivery logistics, bundled accessories, payment method (cash/CBE Birr/Telebirr), meeting location, timing.

CHAT HISTORY:
${chatHistory}

Write ONLY your next reply (1–2 sentences). Sound like a real Ethiopian seller on Telegram — helpful about logistics, firm about price.
Your reply:`
    : `You are the AI secretary of a buyer on an Ethiopian marketplace. Your client wants to buy "${productTitle}" at a fixed price of ${fixedPrice.toLocaleString()} ETB.

CRITICAL RULE: The price is fixed and cannot be reduced. Do not attempt to negotiate the price down.
You SHOULD negotiate on: delivery to a convenient location, bundling accessories, payment terms, pickup timing.

CHAT HISTORY:
${chatHistory}

Write ONLY your next reply (1–2 sentences). Sound like a real Ethiopian buyer on Telegram — practical and friendly.
Your reply:`;

  try {
    return (await callAI(prompt, 8000, 0.7)).trim();
  } catch (err: any) {
    console.error(`AI Fixed-Price Error (${PROVIDER}):`, err?.message);
    return role === 'buyer'
      ? `Is free delivery to Piassa possible since I'm paying the full price?`
      : `Delivery can be arranged — tell me your location and we will sort it out.`;
  }
}
