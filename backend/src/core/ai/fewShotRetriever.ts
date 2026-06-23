/**
 * Few-Shot Retriever — Dynamic Category-Based RAG
 *
 * Dynamically loads and selects the most relevant human negotiation example
 * from the full 12-case buyer/seller datasets based on product title and category.
 *
 * Design: Zero-latency, isolated database loaded dynamically from local training files.
 * Isolation: Buyer dataset is NEVER exposed to the Seller agent, and vice-versa.
 */

import * as path from 'path';

// ── TYPES ───────────────────────────────────────────────────────────────────
interface DialogueTurn {
  sender: 'BUYER' | 'SELLER';
  text: string;
}

interface TrainingCase {
  category: string;
  product: string;
  outcome: string;
  dialogue: DialogueTurn[];
}

// ── DYNAMIC DATASETS LOADING ────────────────────────────────────────────────
const rootPath = path.resolve(__dirname, '../../../');

let BUYER_CASES: TrainingCase[] = [];
let SELLER_CASES: TrainingCase[] = [];

try {
  const buyerVol1 = require(path.join(rootPath, 'telegram-updates/buyer-training-data/buyer_agent_training_dataset.js')).buyerTrainingData || [];
  const buyerVol2 = require(path.join(rootPath, 'telegram-updates/buyer-training-data/buyer_agent_training_dataset_volume_2.js')).buyerTrainingDataV2 || [];
  const buyerVol3 = require(path.join(rootPath, 'telegram-updates/buyer-training-data/buyer_agent_training_dataset_volume_3.js')).buyerTrainingDataV3 || [];
  const buyerVol4 = require(path.join(rootPath, 'telegram-updates/buyer-training-data/buyer_agent_training_dataset_volume_4.js')).buyerTrainingDataV4 || [];

  BUYER_CASES = [...buyerVol1, ...buyerVol2, ...buyerVol3, ...buyerVol4];
} catch (err: any) {
  console.error('[FewShotRetriever] Error loading buyer training datasets:', err.message);
}

try {
  const sellerVol1 = require(path.join(rootPath, 'telegram-updates/seller-training-data/seller_agent_training_dataset.js')).sellerTrainingData || [];
  const sellerVol2 = require(path.join(rootPath, 'telegram-updates/seller-training-data/seller_agent_training_dataset_volume_2.js')).sellerTrainingDataV2 || [];
  const sellerVol3 = require(path.join(rootPath, 'telegram-updates/seller-training-data/seller_agent_training_dataset_volume_3.js')).sellerTrainingDataV3 || [];
  const sellerVol4 = require(path.join(rootPath, 'telegram-updates/seller-training-data/seller_agent_training_dataset_volume_4.js')).sellerTrainingDataV4 || [];

  SELLER_CASES = [...sellerVol1, ...sellerVol2, ...sellerVol3, ...sellerVol4];
} catch (err: any) {
  console.error('[FewShotRetriever] Error loading seller training datasets:', err.message);
}

// ── CATEGORY NORMALIZER ──────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  electronics: 'Electronics',
  vehicles: 'Vehicles',
  'real estate': 'Real Estate',
  furniture: 'Real Estate',
  'home appliances': 'Machinery',
  machinery: 'Machinery',
  agriculture: 'Agriculture',
  food: 'Agriculture',
  'agriculture wholesale': 'Agriculture Wholesale',
  'heavy machinery': 'Heavy Machinery',
  services: 'Real Estate',
  other: 'Electronics',
};

function normalizeCategory(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const key of Object.keys(CATEGORY_MAP)) {
    if (lower.includes(key)) return CATEGORY_MAP[key];
  }
  return 'Electronics'; // safe default
}

// ── FORMATTER ────────────────────────────────────────────────────────────────
function formatDialogue(turns: DialogueTurn[], maxTurns = 12): string {
  return turns
    .slice(0, maxTurns)
    .map(t => `${t.sender}: ${t.text}`)
    .join('\n');
}

// ── PUBLIC API ───────────────────────────────────────────────────────────────
/**
 * Returns a formatted few-shot dialogue example for the given role, category, and product title.
 * Inspects all 12 cases per role to find the closest match.
 */
export function getFewShotExample(
  role: 'buyer' | 'seller',
  productCategory: string,
  productTitle: string = ''
): string | null {
  const normalizedCat = normalizeCategory(productCategory);
  const dataset = role === 'buyer' ? BUYER_CASES : SELLER_CASES;

  if (dataset.length === 0) return null;

  // 1. Try Title Keyword Match first (highly specific)
  if (productTitle) {
    const titleTokens = productTitle.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    let bestCase: TrainingCase | null = null;
    let maxMatchCount = 0;

    for (const item of dataset) {
      const itemTitleLower = item.product.toLowerCase();
      let matchCount = 0;
      for (const token of titleTokens) {
        if (itemTitleLower.includes(token)) {
          matchCount++;
        }
      }
      if (matchCount > maxMatchCount) {
        maxMatchCount = matchCount;
        bestCase = item;
      }
    }

    if (bestCase && maxMatchCount > 0) {
      console.log(`[FewShotRetriever] Specific match found for title "${productTitle}": ${bestCase.product}`);
      return formatDialogue(bestCase.dialogue, 12);
    }
  }

  // 2. Try Exact Category Match
  const categoryMatches = dataset.filter(c => {
    // Symmetrical check (some categories in datasets are e.g. "Real Estate / Agriculture" or "Vehicles / Heavy Machinery")
    const itemCatLower = c.category.toLowerCase();
    const targetCatLower = normalizedCat.toLowerCase();
    return itemCatLower.includes(targetCatLower) || targetCatLower.includes(itemCatLower);
  });

  if (categoryMatches.length > 0) {
    // Pick the first match or a random one to diversify
    const selectedCase = categoryMatches[Math.floor(Math.random() * categoryMatches.length)];
    console.log(`[FewShotRetriever] Category match found for "${normalizedCat}": ${selectedCase.product}`);
    return formatDialogue(selectedCase.dialogue, 12);
  }

  // 3. Absolute Fallback
  const fallbackCase = dataset[0];
  console.log(`[FewShotRetriever] Fallback match used: ${fallbackCase.product}`);
  return formatDialogue(fallbackCase.dialogue, 12);
}
