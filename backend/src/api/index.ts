import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();
export const app = express();

// Allow requests from the Vite frontend dev server and any tunnel
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// GET /api/products - Fetch latest products for the Mini App
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isAvailable: true, isDraft: false },
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    // We must manually convert BigInt fields to strings before sending JSON
    const serializedProducts = products.map(product => {
      return {
        ...product,
        messageId: product.messageId?.toString(),
        seller: {
          ...product.seller,
          channelId: product.seller.channelId.toString()
        }
      };
    });

    res.json({ success: true, data: serializedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// GET /api/resolve-image?file_id=XYZ - Securely resolve Telegram file IDs into temporary URLs
app.get('/api/resolve-image', async (req, res) => {
  const fileId = req.query.file_id as string;
  if (!fileId) {
    return res.status(400).json({ success: false, error: 'Missing file_id' });
  }

  try {
    // 1. Call Telegram API to get the file path
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/getFile?file_id=${fileId}`);
    const data = await response.json();

    if (!data.ok) {
      return res.status(400).json({ success: false, error: data.description });
    }

    // 2. Construct the actual HTTPS URL to the file
    // Note: This URL expires after 1 hour, which is why we do it on-the-fly!
    const fileUrl = `https://api.telegram.org/file/bot${config.botToken}/${data.result.file_path}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Error resolving image:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve image' });
  }
});

export const startApiServer = (port: number = 3000) => {
  app.listen(port, () => {
    console.log(`🚀 Helper API Server running on http://localhost:${port}`);
  });
};
