import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.product.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.user.deleteMany();

  // ── USERS ──────────────────────────────────────────────
  const [u1, u2, u3, u4, u5] = await Promise.all([
    prisma.user.create({ data: { telegramId: 111111111n, username: 'abebe_tech', firstName: 'Abebe' } }),
    prisma.user.create({ data: { telegramId: 222222222n, username: 'fatuma_shop', firstName: 'Fatuma' } }),
    prisma.user.create({ data: { telegramId: 333333333n, username: 'kalid_motors', firstName: 'Kalid' } }),
    prisma.user.create({ data: { telegramId: 444444444n, username: 'meron_fashion', firstName: 'Meron' } }),
    prisma.user.create({ data: { telegramId: 555555555n, username: 'dawit_furniture', firstName: 'Dawit' } }),
  ]);

  // ── SELLERS ────────────────────────────────────────────
  const [s1, s2, s3, s4, s5] = await Promise.all([
    prisma.seller.create({ data: { userId: u1.id, channelId: -1001111111111n, channelName: 'Abebe Tech Store', trustScore: 9 } }),
    prisma.seller.create({ data: { userId: u2.id, channelId: -1002222222222n, channelName: 'Fatuma General Shop', trustScore: 8 } }),
    prisma.seller.create({ data: { userId: u3.id, channelId: -1003333333333n, channelName: 'Kalid Motors & Auto', trustScore: 7 } }),
    prisma.seller.create({ data: { userId: u4.id, channelId: -1004444444444n, channelName: 'Meron Fashion House', trustScore: 8 } }),
    prisma.seller.create({ data: { userId: u5.id, channelId: -1005555555555n, channelName: 'Dawit Home & Furniture', trustScore: 6 } }),
  ]);

  console.log('Created 5 sellers.');

  // ── IMAGE HELPERS ──────────────────────────────────────
  const img = (id: number, w = 400, h = 400) =>
    `https://picsum.photos/seed/${id}/${w}/${h}`;

  // ── PRODUCTS ───────────────────────────────────────────
  const products = [
    // === ELECTRONICS (s1) ===
    { sellerId: s1.id, title: 'iPhone 15 Pro Max 256GB', description: 'Brand new sealed, Natural Titanium, 1yr warranty', price: 95000, condition: 'New', category: 'Electronics', imageUrl: img(10) },
    { sellerId: s1.id, title: 'Samsung Galaxy S24 Ultra', description: '512GB, Phantom Black, AI camera features', price: 88000, condition: 'New', category: 'Electronics', imageUrl: img(11) },
    { sellerId: s1.id, title: 'iPhone 13 128GB', description: 'Used 1 year, excellent condition, battery 89%', price: 42000, condition: 'Used', category: 'Electronics', imageUrl: img(12) },
    { sellerId: s1.id, title: 'Tecno Camon 30 Pro', description: 'Brand new, 256GB, 50MP triple camera', price: 28000, condition: 'New', category: 'Electronics', imageUrl: img(13) },
    { sellerId: s1.id, title: 'Infinix Note 40 Pro', description: 'New, 8GB RAM, 256GB storage, 108MP camera', price: 22000, condition: 'New', category: 'Electronics', imageUrl: img(14) },
    { sellerId: s1.id, title: 'Samsung Galaxy A55', description: 'Like new, 6 months old, 128GB', price: 32000, condition: 'Like New', category: 'Electronics', imageUrl: img(15) },
    { sellerId: s1.id, title: 'Google Pixel 8', description: 'Unlocked, Hazel color, 7 years OS updates', price: 68000, condition: 'New', category: 'Electronics', imageUrl: img(16) },
    { sellerId: s1.id, title: 'Redmi Note 13 Pro', description: 'New, 200MP camera, 5000mAh battery', price: 18000, condition: 'New', category: 'Electronics', imageUrl: img(17) },

    // === COMPUTERS (s1) ===
    { sellerId: s1.id, title: 'MacBook Pro M3 14"', description: 'Brand new, 16GB RAM, 512GB SSD, Space Black', price: 185000, condition: 'New', category: 'Computers', imageUrl: img(20) },
    { sellerId: s1.id, title: 'MacBook Air M2', description: 'Used 8 months, 8GB RAM, 256GB SSD, battery 91%', price: 72000, condition: 'Used', category: 'Computers', imageUrl: img(21) },
    { sellerId: s1.id, title: 'Dell XPS 15 i7', description: 'Like new, 16GB RAM, 512GB SSD, NVIDIA RTX 3050', price: 95000, condition: 'Like New', category: 'Computers', imageUrl: img(22) },
    { sellerId: s1.id, title: 'HP Probook 450 G9 Core i7', description: 'Used 1yr, 16GB RAM, 512GB SSD, business laptop', price: 55000, condition: 'Used', category: 'Computers', imageUrl: img(23) },
    { sellerId: s1.id, title: 'Lenovo ThinkPad X1 Carbon', description: 'Like new, ultralight, 16GB RAM, 1TB SSD', price: 115000, condition: 'Like New', category: 'Computers', imageUrl: img(24) },
    { sellerId: s1.id, title: 'Asus ROG Strix G15 Gaming', description: 'New, RTX 4060, i9, 32GB RAM, 1TB SSD', price: 145000, condition: 'New', category: 'Computers', imageUrl: img(25) },

    // === ACCESSORIES (s1) ===
    { sellerId: s1.id, title: 'Sony WH-1000XM5 Headphones', description: 'New, best ANC, 30hr battery, multipoint connect', price: 21000, condition: 'New', category: 'Electronics', imageUrl: img(30) },
    { sellerId: s1.id, title: 'AirPods Pro 2nd Gen', description: 'New sealed, USB-C, active noise cancellation', price: 24000, condition: 'New', category: 'Electronics', imageUrl: img(31) },
    { sellerId: s1.id, title: 'Samsung 65" 4K QLED TV', description: 'New, Quantum HDR, smart TV, 2024 model', price: 185000, condition: 'New', category: 'Electronics', imageUrl: img(32) },
    { sellerId: s1.id, title: 'iPad Pro M2 11"', description: 'Like new, 256GB WiFi+Cellular, Apple Pencil included', price: 85000, condition: 'Like New', category: 'Electronics', imageUrl: img(33) },
    { sellerId: s1.id, title: 'DJI Mini 4 Pro Drone', description: 'New, 4K/60fps, obstacle sensing, 34min flight', price: 95000, condition: 'New', category: 'Electronics', imageUrl: img(34) },
    { sellerId: s1.id, title: 'GoPro Hero 12 Black', description: 'New, 5.3K video, HyperSmooth 6.0, waterproof', price: 45000, condition: 'New', category: 'Electronics', imageUrl: img(35) },

    // === VEHICLES (s3) ===
    { sellerId: s3.id, title: 'Toyota Corolla 2019', description: '55,000km, automatic, accident free, full option', price: 2800000, condition: 'Used', category: 'Vehicles', imageUrl: img(40) },
    { sellerId: s3.id, title: 'Toyota Hilux 2020 Double Cab', description: '40,000km, 4x4, diesel, excellent condition', price: 4200000, condition: 'Used', category: 'Vehicles', imageUrl: img(41) },
    { sellerId: s3.id, title: 'Hyundai Tucson 2021', description: '30,000km, panoramic roof, leather seats, full option', price: 3500000, condition: 'Used', category: 'Vehicles', imageUrl: img(42) },
    { sellerId: s3.id, title: 'Bajaj Boxer 150cc Motorcycle', description: 'Used 2yr, good condition, 25km/L fuel economy', price: 85000, condition: 'Used', category: 'Vehicles', imageUrl: img(43) },
    { sellerId: s3.id, title: 'TVS Apache RTR 160', description: 'Like new, 8,000km only, racing suspension', price: 110000, condition: 'Like New', category: 'Vehicles', imageUrl: img(44) },
    { sellerId: s3.id, title: 'Honda CB 125F', description: 'New 2024, fuel injection, 6-speed gearbox', price: 130000, condition: 'New', category: 'Vehicles', imageUrl: img(45) },
    { sellerId: s3.id, title: 'Lifan 200cc Motorcycle', description: 'Used 1yr, great for long distance, 35km/L', price: 68000, condition: 'Used', category: 'Vehicles', imageUrl: img(46) },
    { sellerId: s3.id, title: 'Toyota RAV4 2018 Hybrid', description: '65,000km, hybrid electric, no accidents, AWD', price: 3800000, condition: 'Used', category: 'Vehicles', imageUrl: img(47) },
    { sellerId: s3.id, title: 'Suzuki Swift 2020', description: '45,000km, automatic, very economical, city car', price: 1600000, condition: 'Used', category: 'Vehicles', imageUrl: img(48) },
    { sellerId: s3.id, title: 'Auto Spare Parts - Engine Oil 5W30', description: 'Castrol GTX 5L, suitable for all engines', price: 1200, condition: 'New', category: 'Vehicles', imageUrl: img(49) },

    // === FASHION & CLOTHING (s4) ===
    { sellerId: s4.id, title: 'Traditional Ethiopian Habesha Kemis', description: 'White with colored tilet, sizes S-XL, handmade', price: 4500, condition: 'New', category: 'Clothing', imageUrl: img(50) },
    { sellerId: s4.id, title: 'Nike Air Force 1 Sneakers', description: 'Original, white, size 40-45 available', price: 6500, condition: 'New', category: 'Clothing', imageUrl: img(51) },
    { sellerId: s4.id, title: 'Adidas Ultraboost Running Shoes', description: 'Original, black/white, sizes 39-44', price: 8500, condition: 'New', category: 'Clothing', imageUrl: img(52) },
    { sellerId: s4.id, title: 'Men\'s Formal Suit Set', description: 'Turkish fabric, dark navy, slim fit, custom tailor', price: 7500, condition: 'New', category: 'Clothing', imageUrl: img(53) },
    { sellerId: s4.id, title: 'Women\'s Hijab Collection (5 pieces)', description: 'Premium chiffon, assorted colors, one size', price: 1800, condition: 'New', category: 'Clothing', imageUrl: img(54) },
    { sellerId: s4.id, title: 'Levi\'s 511 Slim Jeans', description: 'Original, dark wash, size 30-36 available', price: 3200, condition: 'New', category: 'Clothing', imageUrl: img(55) },
    { sellerId: s4.id, title: 'Leather Handbag (Italian)', description: 'Genuine leather, brown, shoulder strap included', price: 5500, condition: 'New', category: 'Clothing', imageUrl: img(56) },
    { sellerId: s4.id, title: 'Ray-Ban Wayfarer Sunglasses', description: 'Original with case, polarized lens, UV400', price: 4200, condition: 'New', category: 'Clothing', imageUrl: img(57) },
    { sellerId: s4.id, title: 'Gold Necklace 18K 5g', description: 'Hallmarked Ethiopian gold, chain + pendant', price: 12000, condition: 'New', category: 'Jewelry', imageUrl: img(58) },
    { sellerId: s4.id, title: 'Casio G-Shock Watch', description: 'Original, black, water resistant 200m, solar', price: 8900, condition: 'New', category: 'Clothing', imageUrl: img(59) },

    // === HOME APPLIANCES (s2) ===
    { sellerId: s2.id, title: 'LG Washing Machine 8KG', description: 'New, inverter motor, steam wash, 5yr warranty', price: 28000, condition: 'New', category: 'Home Appliances', imageUrl: img(60) },
    { sellerId: s2.id, title: 'Samsung Refrigerator 350L', description: 'New, no-frost, digital inverter, 10yr warranty', price: 32000, condition: 'New', category: 'Home Appliances', imageUrl: img(61) },
    { sellerId: s2.id, title: 'Ariston Gas Stove 4 Burner', description: 'New, stainless steel, auto ignition, glass top', price: 9500, condition: 'New', category: 'Home Appliances', imageUrl: img(62) },
    { sellerId: s2.id, title: 'Midea Air Conditioner 1.5HP', description: 'New, inverter, 5-star energy rating, WiFi control', price: 24000, condition: 'New', category: 'Home Appliances', imageUrl: img(63) },
    { sellerId: s2.id, title: 'Blender & Juicer Combo 2000W', description: 'New, 6-speed settings, stainless blades, 2L jar', price: 3200, condition: 'New', category: 'Home Appliances', imageUrl: img(64) },
    { sellerId: s2.id, title: 'Sharp Microwave Oven 30L', description: 'New, grill + convection, digital display, timer', price: 7800, condition: 'New', category: 'Home Appliances', imageUrl: img(65) },
    { sellerId: s2.id, title: 'Bosch Dishwasher 12 Place', description: 'Like new, 6 programs, half load option', price: 35000, condition: 'Like New', category: 'Home Appliances', imageUrl: img(66) },
    { sellerId: s2.id, title: 'Breville Espresso Machine', description: 'Used 6mo, excellent condition, 15bar pump', price: 22000, condition: 'Used', category: 'Home Appliances', imageUrl: img(67) },

    // === FURNITURE (s5) ===
    { sellerId: s5.id, title: 'L-Shape Sofa Set 7-Seater', description: 'New, premium velvet, dark grey, solid wood frame', price: 28000, condition: 'New', category: 'Furniture', imageUrl: img(70) },
    { sellerId: s5.id, title: 'Queen Size Bed with Mattress', description: 'New, solid mahogany, orthopedic mattress included', price: 22000, condition: 'New', category: 'Furniture', imageUrl: img(71) },
    { sellerId: s5.id, title: 'Office Desk & Chair Set', description: 'New, ergonomic mesh chair, L-shaped desk, USB port', price: 12000, condition: 'New', category: 'Furniture', imageUrl: img(72) },
    { sellerId: s5.id, title: 'Dining Table 6-Seater', description: 'New, glass top, stainless steel legs, modern design', price: 18000, condition: 'New', category: 'Furniture', imageUrl: img(73) },
    { sellerId: s5.id, title: 'Wardrobe 3-Door with Mirror', description: 'New, sliding mirror doors, 6 shelves, 2 drawers', price: 15000, condition: 'New', category: 'Furniture', imageUrl: img(74) },
    { sellerId: s5.id, title: 'Bookshelf 6-Tier Wooden', description: 'New, solid pine, natural finish, adjustable shelves', price: 5500, condition: 'New', category: 'Furniture', imageUrl: img(75) },
    { sellerId: s5.id, title: 'Study Table for Kids', description: 'New, height-adjustable, anti-slip, blue color', price: 3800, condition: 'New', category: 'Furniture', imageUrl: img(76) },
    { sellerId: s5.id, title: 'Recliner Sofa Chair', description: 'Used 1yr, leather, massage function, cup holder', price: 9500, condition: 'Used', category: 'Furniture', imageUrl: img(77) },

    // === REAL ESTATE (s5) ===
    { sellerId: s5.id, title: 'Studio Apartment for Rent - Bole', description: '35sqm, furnished, WiFi, 24hr security, 5th floor', price: 18000, condition: 'New', category: 'Real Estate', imageUrl: img(80) },
    { sellerId: s5.id, title: '2-Bedroom Apartment - Kazanchis', description: '85sqm, parking, elevator, 2 bathrooms, DSQ', price: 35000, condition: 'New', category: 'Real Estate', imageUrl: img(81) },
    { sellerId: s5.id, title: 'Office Space for Rent - CMC', description: '120sqm, open plan, fiber internet, generator backup', price: 55000, condition: 'New', category: 'Real Estate', imageUrl: img(82) },
    { sellerId: s5.id, title: 'Villa for Sale - Old Airport', description: '400sqm land, 250sqm built, 4 beds, large garden', price: 12500000, condition: 'Used', category: 'Real Estate', imageUrl: img(83) },

    // === SPORTS & FITNESS (s2) ===
    { sellerId: s2.id, title: 'Treadmill Home Use 2HP', description: 'New, 12 programs, 0-16km/h speed, foldable', price: 22000, condition: 'New', category: 'Sports', imageUrl: img(85) },
    { sellerId: s2.id, title: 'Adjustable Dumbbell Set 50kg', description: 'New, quick adjust 2.5-25kg each, rubber coated', price: 8500, condition: 'New', category: 'Sports', imageUrl: img(86) },
    { sellerId: s2.id, title: 'Yoga Mat + Blocks Set', description: 'New, premium TPE, 6mm thick, non-slip surface', price: 1200, condition: 'New', category: 'Sports', imageUrl: img(87) },
    { sellerId: s2.id, title: 'Football Nike Flight Match', description: 'New, official size 5, thermobonded, FIFA approved', price: 2800, condition: 'New', category: 'Sports', imageUrl: img(88) },
    { sellerId: s2.id, title: 'Boxing Gloves Everlast 14oz', description: 'New, genuine leather, wrist wrap included', price: 4500, condition: 'New', category: 'Sports', imageUrl: img(89) },

    // === BOOKS & EDUCATION (s4) ===
    { sellerId: s4.id, title: 'Matric (12th Grade) Complete Study Pack', description: 'All subjects, solved past papers, 2020-2024', price: 1500, condition: 'Used', category: 'Books', imageUrl: img(90) },
    { sellerId: s4.id, title: 'IELTS Preparation Books (Full Set)', description: 'Cambridge + Barrons, latest edition, like new', price: 2200, condition: 'Like New', category: 'Books', imageUrl: img(91) },
    { sellerId: s4.id, title: 'Medical Textbook Collection (Year 1-3)', description: 'AAU medical school books, good condition, 10 books', price: 4500, condition: 'Used', category: 'Books', imageUrl: img(92) },

    // === BABY & KIDS (s4) ===
    { sellerId: s4.id, title: 'Baby Stroller Travel System', description: 'New, 3-in-1, car seat included, rain cover', price: 12000, condition: 'New', category: 'Baby & Kids', imageUrl: img(93) },
    { sellerId: s4.id, title: 'Kids Bicycle 20" (Age 6-10)', description: 'New, training wheels, front & rear brakes, bell', price: 4800, condition: 'New', category: 'Baby & Kids', imageUrl: img(94) },
    { sellerId: s4.id, title: 'LEGO Technic Set 1000pcs', description: 'New, sealed, age 10+, car building kit', price: 3500, condition: 'New', category: 'Baby & Kids', imageUrl: img(95) },

    // === BEAUTY (s4) ===
    { sellerId: s4.id, title: 'Original Shea Butter 500g', description: 'Unrefined, pure Ethiopian origin, skin & hair', price: 650, condition: 'New', category: 'Beauty', imageUrl: img(96) },
    { sellerId: s4.id, title: 'Professional Hair Dryer 2400W', description: 'New, ionic technology, 3 heat settings, diffuser', price: 3200, condition: 'New', category: 'Beauty', imageUrl: img(97) },

    // === FOOD & BEVERAGES (s2) ===
    { sellerId: s2.id, title: 'Ethiopian Coffee Yirgacheffe 1kg', description: 'Single origin, light roast, freshly roasted, export grade', price: 850, condition: 'New', category: 'Food', imageUrl: img(98) },
    { sellerId: s2.id, title: 'Berbere Spice Mix 500g', description: 'Traditional homemade recipe, sun-dried chilis, rich aroma', price: 280, condition: 'New', category: 'Food', imageUrl: img(99) },
    { sellerId: s2.id, title: 'Organic Honey Tigray 1kg', description: 'Raw unprocessed forest honey, dark amber, rich taste', price: 750, condition: 'New', category: 'Food', imageUrl: img(100) },

    // === SERVICES & OTHER (s3) ===
    { sellerId: s3.id, title: 'Generator 5KVA Silent Diesel', description: 'New, 5000W continuous, electric start, 12hr tank', price: 65000, condition: 'New', category: 'Other', imageUrl: img(101) },
    { sellerId: s3.id, title: 'Solar Panel 400W Monocrystalline', description: 'New, tier-1 cell, 25yr warranty, with mounting kit', price: 18000, condition: 'New', category: 'Other', imageUrl: img(102) },
    { sellerId: s3.id, title: 'CCTV Camera System 8-Channel', description: 'New, 4K NVR, 8 cameras, 2TB HDD, night vision', price: 28000, condition: 'New', category: 'Other', imageUrl: img(103) },
    { sellerId: s3.id, title: 'Canon DSLR Camera 90D + 18-135mm Lens', description: 'Like new, 32MP, 4K video, dual pixel AF, < 5000 shots', price: 85000, condition: 'Like New', category: 'Electronics', imageUrl: img(104) },
    { sellerId: s3.id, title: 'PlayStation 5 Console', description: 'New, disc version, 1TB SSD, 2 controllers, FIFA 24', price: 75000, condition: 'New', category: 'Electronics', imageUrl: img(105) },
    { sellerId: s3.id, title: 'Xbox Series X 1TB', description: 'Like new, quick resume, 4K gaming, Game Pass ready', price: 62000, condition: 'Like New', category: 'Electronics', imageUrl: img(106) },
    { sellerId: s5.id, title: 'Water Purifier 7-Stage RO', description: 'New, 75GPD, mineralizer stage, tank included, NSF certified', price: 12500, condition: 'New', category: 'Home Appliances', imageUrl: img(107) },
    { sellerId: s5.id, title: 'Electric Water Heater 50L', description: 'New, 1500W, foam insulation, 5yr tank warranty', price: 7200, condition: 'New', category: 'Home Appliances', imageUrl: img(108) },
    { sellerId: s1.id, title: 'Portable Power Bank 30000mAh', description: 'New, 65W PD, 3 USB ports, LED display, airline safe', price: 2800, condition: 'New', category: 'Electronics', imageUrl: img(109) },
    { sellerId: s1.id, title: 'Mechanical Gaming Keyboard RGB', description: 'New, Blue switches, per-key RGB, aluminium frame', price: 4500, condition: 'New', category: 'Electronics', imageUrl: img(110) },
    { sellerId: s1.id, title: 'Logitech MX Master 3S Mouse', description: 'New, silent clicks, 8K DPI, multi-device Bluetooth', price: 5800, condition: 'New', category: 'Electronics', imageUrl: img(111) },
    { sellerId: s2.id, title: 'Electric Kettle 1.7L', description: 'New, double-wall insulation, 360 base, keep warm 30min', price: 1650, condition: 'New', category: 'Home Appliances', imageUrl: img(112) },
    { sellerId: s4.id, title: 'Perfume Lattafa Oud for Glory 100ml', description: 'Original, long-lasting oriental scent, gift box', price: 2400, condition: 'New', category: 'Beauty', imageUrl: img(113) },
  ];

  let count = 0;
  for (const p of products) {
    await prisma.product.create({ data: { ...p, isDraft: false } });
    count++;
  }

  console.log(`✅ Seeding finished! Created ${count} products across 5 sellers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
