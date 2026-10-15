require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const { Product } = require("../models/product.models.js");

const newProducts = [
  {
    title: "ProShot Camera X1",
    description: "24MP mirrorless camera for photography enthusiasts",
    brand: "LensCraft",
    price: 55000,
    stock: 7,
    category: "Electronics",
    tags: ["camera", "mirrorless", "photography", "DSLR", "lens"],
    thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU010"
  },
  {
    title: "SwiftCard 128GB Memory Card",
    description: "High-speed UHS-I SD card for cameras and drones",
    brand: "DataPro",
    price: 1299,
    stock: 100,
    category: "Accessories",
    tags: ["memory card", "SD card", "camera accessory", "storage", "photography"],
    thumbnail: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU011"
  },
  {
    title: "LensPro Camera Bag",
    description: "Padded camera bag with compartments for lenses and accessories",
    brand: "BagIt",
    price: 2999,
    stock: 25,
    category: "Accessories",
    tags: ["camera bag", "camera accessory", "carry", "photography", "padded"],
    thumbnail: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU012"
  },
  {
    title: "FreshFace Vitamin C Serum",
    description: "Brightening vitamin C serum for daily skincare routine",
    brand: "SkinLab",
    price: 1199,
    stock: 35,
    category: "Beauty",
    tags: ["serum", "skincare", "vitamin C", "brightening", "face care"],
    thumbnail: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU013"
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.insertMany(newProducts);
  const count = await Product.countDocuments();
  console.log(`Seed complete. Product count: ${count}`);
  process.exit(0);
}

seed();
