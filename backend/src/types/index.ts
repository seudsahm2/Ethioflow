export interface User {
  id: string;
  telegramId: number | bigint;
  username?: string;
  firstName?: string;
  createdAt: Date;
}

export interface Seller {
  id: string;
  userId: string;
  channelId: number | bigint;
  channelName: string;
  trustScore: number;
  brandVoiceRules?: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  price: number;
  condition?: string;
  category?: string;
  telegramFileIds: string[];
  isAvailable: boolean;
  isDraft: boolean;
  missingFields?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Data expected back from the AI parsing the channel post
export interface ParsedProductData {
  title: string;
  description?: string;
  price: number;
  minPrice?: number;
  isFixedPrice?: boolean;
  condition: string;
  category: string;
  isDraft?: boolean;
  missingFields?: string | null;
  telegramFileIds?: string[];
}

// Bot context extensions can go here
export interface SessionData {
  searchQuery?: string;
  negotiationStep?: number;
}
