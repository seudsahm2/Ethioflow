/**
 * Mock Data Service
 * 
 * This file provides mock product data for development and testing.
 * When the real database services are ready, simply replace the
 * implementation of these functions to call the actual productService.
 * 
 * The interface remains the same, keeping the code clean.
 */

import { Product } from '../types';
import * as productService from '../core/services/productService';

// Mock product data
const mockProducts: Product[] = [
  {
    id: '1',
    sellerId: 'seller-1',
    title: 'iPhone 13 Pro Max 256GB',
    description: 'Excellent condition, barely used. Comes with original box and charger. No scratches.',
    price: 45000,
    condition: 'Like New',
    category: 'Electronics',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=iPhone+13+Pro',
    isAvailable: true,
    isDraft: false,
    missingFields: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    sellerId: 'seller-2',
    title: 'MacBook Air M1 2020',
    description: 'Perfect for students and professionals. 8GB RAM, 256GB SSD. Battery health 95%.',
    price: 55000,
    condition: 'Used',
    category: 'Electronics',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=MacBook+Air',
    isAvailable: true,
    isDraft: false,
    missingFields: null,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    sellerId: 'seller-1',
    title: 'Samsung Galaxy S23 Ultra',
    description: 'Brand new, sealed in box. 512GB storage, Phantom Black color.',
    price: 65000,
    condition: 'New',
    category: 'Electronics',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Galaxy+S23',
    isAvailable: true,
    isDraft: false,
    missingFields: null,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: '4',
    sellerId: 'seller-3',
    title: 'Sony WH-1000XM5 Headphones',
    description: 'Premium noise-cancelling headphones. Used for 3 months, excellent condition.',
    price: 18000,
    condition: 'Like New',
    category: 'Electronics',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Sony+Headphones',
    isAvailable: true,
    isDraft: false,
    missingFields: null,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '5',
    sellerId: 'seller-2',
    title: 'iPad Pro 11" 2021',
    description: 'M1 chip, 128GB, Space Gray. Includes Apple Pencil 2nd gen and Magic Keyboard.',
    price: 42000,
    condition: 'Used',
    category: 'Electronics',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=iPad+Pro',
    isAvailable: true,
    isDraft: false,
    missingFields: null,
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '6',
    sellerId: 'seller-3',
    title: 'Dell XPS 15 Laptop',
    description: 'i7 processor, 16GB RAM, 512GB SSD, NVIDIA GTX 1650. Perfect for gaming and work.',
    price: 72000,
    condition: 'Used',
    category: 'Electronics',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Dell+XPS',
    isAvailable: true,
    isDraft: false,
    missingFields: null,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

/**
 * Search products by query string
 * 
 * Calls the actual productService if USE_REAL_DB env is true and the service exists,
 * otherwise falls back to mock products.
 */
export const searchProducts = async (query: string): Promise<Product[]> => {
  if (process.env.USE_REAL_DB === 'true' && typeof productService.searchProducts === 'function') {
    try {
      return await productService.searchProducts(query);
    } catch (error) {
      console.error('Error fetching real search products, using mock:', error);
    }
  }

  // Simulate async database call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!query || query.trim() === '') {
    return mockProducts;
  }
  
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(product => 
    product.title.toLowerCase().includes(lowerQuery) ||
    product.description?.toLowerCase().includes(lowerQuery) ||
    product.category?.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Get product by ID
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  if (process.env.USE_REAL_DB === 'true' && typeof (productService as any).getProductById === 'function') {
    try {
      return await (productService as any).getProductById(id);
    } catch (error) {
      console.error('Error fetching real product by ID, using mock:', error);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 50));
  return mockProducts.find(p => p.id === id) || null;
};

/**
 * Get all available products
 */
export const getAllProducts = async (): Promise<Product[]> => {
  if (process.env.USE_REAL_DB === 'true' && typeof (productService as any).getAllProducts === 'function') {
    try {
      return await (productService as any).getAllProducts();
    } catch (error) {
      console.error('Error fetching real all products, using mock:', error);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 100));
  return mockProducts.filter(p => p.isAvailable);
};
