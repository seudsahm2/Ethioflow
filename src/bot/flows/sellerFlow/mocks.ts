import { ParsedProductData, Product, Seller } from '../../../types';

export const parseProductFromText = async (text: string): Promise<ParsedProductData> => {
  return {
    title: "Mock Product",
    description: "Mock Description from text: " + text.substring(0, 20),
    price: 1000,
    condition: "New",
    category: "Electronics"
  };
};

export const saveProduct = async (productData: Partial<Product>): Promise<Product> => {
  console.log("Mock saving product:", productData);
  return {
    id: "mock-product-id",
    sellerId: productData.sellerId || "mock-seller-id",
    title: productData.title || "Mock Title",
    description: productData.description || "",
    price: productData.price || 0,
    condition: productData.condition,
    category: productData.category,
    imageUrl: productData.imageUrl,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const registerSeller = async (userId: string, channelId: number | bigint, channelName: string): Promise<Seller> => {
  console.log(`Mock registering seller User:${userId} Channel:${channelId} Name:${channelName}`);
  return {
    id: "mock-seller-id",
    userId,
    channelId,
    channelName,
    trustScore: 100,
    createdAt: new Date()
  };
};