import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './src/models/product.models.js';

dotenv.config({ path: '.env' });

const DB_NAME = "videotube";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

async function capPrices() {
  await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
  console.log("Connected to MongoDB");

  const expensiveProducts = await Product.find({ price: { $gt: 45000 } });
  
  for (const product of expensiveProducts) {
    const oldPrice = product.price;
    // Drop the price significantly to stay under 5L even for multiple quantities
    product.price = Math.floor(product.price / 20); 
    if (product.price > 45000) product.price = 45000;
    
    await product.save();
    console.log(`Updated ${product.title}: ${oldPrice} -> ${product.price}`);
  }

  console.log("Finished capping prices.");
  process.exit(0);
}

capPrices();
