require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const { Product } = require("./src/models/product.models.js");
async function count() {
  await mongoose.connect(process.env.MONGODB_URI);
  const total = await Product.countDocuments();
  console.log("Total in DB:", total);
  process.exit(0);
}
count();
