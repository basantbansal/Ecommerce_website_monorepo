require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const { Product } = require("../models/product.models.js");

const products = [
  // CLUSTER A
  {
     title: "UltraBook Pro 15",
     description: "High-performance laptop for developers and creators",
     brand: "TechCore",
     price: 75000,
     stock: 10,
     category: "Electronics",
     tags: ["laptop", "computer", "ultrabook", "developer", "portable"],
     thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
     user: new mongoose.Types.ObjectId(),
     sku: "SKU001"
   },
   {
     title: "SwiftClick X200",
     description: "Ergonomic wireless mouse with long battery life",
     brand: "TechCore",
     price: 1499,
     stock: 50,
     category: "Electronics",
     tags: ["mouse", "wireless", "accessory", "laptop accessory", "computer"],
     thumbnail: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
     user: new mongoose.Types.ObjectId(),
     sku: "SKU002"
   },
   {
     title: "CarryPro Sleeve 15",
     description: "Slim protective laptop sleeve with accessory pocket",
     brand: "BagIt",
     price: 1999,
     stock: 30,
     category: "Accessories",
     tags: ["laptop bag", "sleeve", "laptop accessory", "portable", "carry"],
     thumbnail: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
     user: new mongoose.Types.ObjectId(),
     sku: "SKU003"
   },
   // CLUSTER B
   {
     title: "Bleu Intense",
     description: "Premium woody fragrance for men",
     brand: "LuxScent",
     price: 2499,
     stock: 20,
     category: "Beauty",
     tags: ["perfume", "fragrance", "men", "woody", "luxury"],
     thumbnail: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=400",
     user: new mongoose.Types.ObjectId(),
     sku: "SKU004"
   },
   {
     title: "Midnight Oud",
     description: "Rich oud and amber evening fragrance",
     brand: "LuxScent",
     price: 3299,
     stock: 15,
     category: "Beauty",
     tags: ["perfume", "fragrance", "oud", "amber", "luxury", "evening"],
     thumbnail: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400",
     user: new mongoose.Types.ObjectId(),
     sku: "SKU005"
   },
   {
     title: "GlowSoft Body Lotion",
     description: "Moisturising body lotion with vitamin E",
     brand: "SkinLab",
     price: 799,
     stock: 40,
     category: "Beauty",
     tags: ["lotion", "skincare", "body", "moisturiser", "vitamin E"],
     thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400",
     user: new mongoose.Types.ObjectId(),
     sku: "SKU006"
   },
   // CLUSTER C
   {
     title: "VisionMax 55 4K TV",
     description: "55-inch 4K smart TV with HDR and built-in streaming",
     brand: "ViewTech",
     price: 45000,
     stock: 8,
     category: "Electronics",
     tags: ["tv", "television", "smart tv", "4K", "HDR", "streaming", "home"],
     thumbnail: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
     user: new mongoose.Types.ObjectId(),
     sku: "SKU007"
   },
   {
     title: "SoundWave Soundbar 2.1",
     description: "Powerful 2.1 soundbar with subwoofer for home theatre",
     brand: "AudioPro",
     price: 12000,
     stock: 12,
     category: "Electronics",
     tags: ["soundbar", "audio", "home theatre", "speaker", "tv accessory"],
     thumbnail: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400",
     user: new mongoose.Types.ObjectId(),
     sku: "SKU008"
   },
   {
     title: "BrightHome Smart LED Bulbs (Pack of 4)",
     description: "App-controlled colour LED bulbs compatible with all smart home systems",
     brand: "BrightHome",
     price: 999,
     stock: 60,
     category: "Smart Home",
     tags: ["bulb", "smart bulb", "LED", "smart home", "colour", "lighting"],
     thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
     user: new mongoose.Types.ObjectId(),
     sku: "SKU009"
   }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.deleteMany({}); // clear existing
  await Product.insertMany(products);
  const count = await Product.countDocuments();
  console.log(`Seed complete. Product count: ${count}`);
  process.exit(0);
}

seed();
