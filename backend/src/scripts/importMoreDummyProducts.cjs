require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const axios = require("axios");
const { Product } = require("../models/product.models.js");

async function run() {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/videotube`);
    const res = await axios.get("https://dummyjson.com/products?limit=100");
    const dummyProducts = res.data.products;
    
    // Convert them to match our model
    const productsToInsert = dummyProducts.map(p => ({
      title: p.title,
      description: p.description,
      brand: p.brand || "Generic",
      price: Math.round(p.price * 80), // dummyjson is in USD, convert to approx INR
      stock: p.stock,
      category: p.category,
      tags: p.tags,
      thumbnail: p.thumbnail,
      images: p.images,
      sku: p.sku || `DUMMY-${p.id}`,
      user: new mongoose.Types.ObjectId() // fake user
    }));
    
    // Clear and insert
    await Product.deleteMany({});
    const result = await Product.insertMany(productsToInsert);
    console.log(`✅ Successfully imported ${result.length} real products with working images from DummyJSON!`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
run();
