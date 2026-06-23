/**
 * Shared in-memory bot state.
 * Stores lightweight pending interactions that don't need DB persistence.
 */

/**
 * Maps a seller's Telegram ID (as string) → the productId awaiting a minPrice input.
 * Set when a product is successfully listed; cleared once seller provides the number.
 */
export const pendingMinPrice = new Map<string, string>();

// ─── Product Wizard Session ──────────────────────────────────────────────────

export type WizardStep =
  | 'CATEGORY'
  | 'TITLE'
  | 'DESCRIPTION'
  | 'PRICE'
  | 'PRICING_TYPE'   // NEW: Fixed Price vs Negotiable
  | 'MIN_PRICE'
  | 'IMAGE'
  | 'SPECIFIC_FIELDS'
  | 'CONFIRM';

export interface ProductListingSession {
  step: WizardStep;
  category: string;         // e.g. 'food', 'electronics', 'house', 'other'
  title: string;
  description: string;
  price: number;
  isFixedPrice: boolean;    // NEW: whether price is fixed or negotiable
  minPrice: number;
  imageUrl?: string;        // public HTTPS URL after upload, or undefined if skipped
  imageFileId?: string;     // Telegram file_id (kept as fallback before upload)
  // Category-specific fields, stored as key → value pairs
  specificFields: Record<string, string>;
  // Which specific fields remain to be collected (queue)
  pendingSpecificFields: string[];
  // ID of the prompt message we sent so we can edit/delete it later
  promptMessageId?: number;
}

/**
 * Maps a seller's Telegram ID (as string) → their active product listing session.
 * Set when they tap "📦 Post a Product"; cleared on confirmation or cancellation.
 */
export const productWizardSessions = new Map<string, ProductListingSession>();

// ─── Category Definitions ────────────────────────────────────────────────────

export interface CategoryField {
  key: string;
  label: string;
  /** 'text' = free-text reply, 'choice' = inline keyboard of options */
  type: 'text' | 'choice';
  options?: string[]; // only for 'choice' type
  optional?: boolean;
}

export interface CategoryDefinition {
  id: string;
  emoji: string;
  label: string;
  fields: CategoryField[];
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'electronics',
    emoji: '🔌',
    label: 'Electronics',
    fields: [
      { key: 'condition', label: 'Condition', type: 'choice', options: ['New', 'Like New', 'Used', 'For Parts'] },
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'warranty', label: 'Warranty Details', type: 'text', optional: true },
    ],
  },
  {
    id: 'food',
    emoji: '🍔',
    label: 'Food & Groceries',
    fields: [
      { key: 'quantity', label: 'Quantity / Weight (e.g. 1kg, 500ml)', type: 'text' },
      { key: 'expiry', label: 'Expiry / Best Before', type: 'text', optional: true },
    ],
  },
  {
    id: 'house',
    emoji: '🏠',
    label: 'House / Real Estate',
    fields: [
      { key: 'location', label: 'Location / Sub-city', type: 'text' },
      { key: 'bedrooms', label: 'Number of Bedrooms', type: 'choice', options: ['Studio', '1', '2', '3', '4', '5+'] },
      { key: 'furnished', label: 'Furnished?', type: 'choice', options: ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'] },
    ],
  },
  {
    id: 'fashion',
    emoji: '👗',
    label: 'Fashion & Clothing',
    fields: [
      { key: 'size', label: 'Size', type: 'text' },
      { key: 'condition', label: 'Condition', type: 'choice', options: ['New', 'Like New', 'Used'] },
      { key: 'material', label: 'Material / Fabric', type: 'text', optional: true },
    ],
  },
  {
    id: 'vehicles',
    emoji: '🚗',
    label: 'Vehicles',
    fields: [
      { key: 'make_model', label: 'Make & Model (e.g. Toyota Corolla)', type: 'text' },
      { key: 'year', label: 'Year', type: 'text' },
      { key: 'mileage', label: 'Mileage (km)', type: 'text', optional: true },
      { key: 'condition', label: 'Condition', type: 'choice', options: ['Excellent', 'Good', 'Fair', 'Needs Repair'] },
    ],
  },
  {
    id: 'other',
    emoji: '📦',
    label: 'Other / General',
    fields: [
      { key: 'condition', label: 'Condition', type: 'choice', options: ['New', 'Like New', 'Used', 'For Parts'] },
    ],
  },
];
