require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const { Product } = require("../models/product.models.js");

// Expanded product catalog to cover all combo map scenarios
const expandedProducts = [
  // === COMPUTER PERIPHERALS (keyboard, mouse combos) ===
  {
    title: "MechaType Pro Keyboard",
    description: "Mechanical gaming keyboard with RGB backlighting and blue switches",
    brand: "TechCore",
    price: 3499,
    stock: 25,
    category: "Electronics",
    tags: ["keyboard", "mechanical", "gaming", "RGB", "computer", "laptop accessory"],
    thumbnail: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU014"
  },
  {
    title: "SilentType Wireless Keyboard",
    description: "Slim wireless keyboard for office and home use",
    brand: "TechCore",
    price: 1799,
    stock: 40,
    category: "Electronics",
    tags: ["keyboard", "wireless", "office", "slim", "laptop accessory"],
    thumbnail: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU015"
  },
  {
    title: "GlidePad XXL Gaming Mousepad",
    description: "Extended gaming mousepad with anti-slip rubber base",
    brand: "TechCore",
    price: 599,
    stock: 50,
    category: "Accessories",
    tags: ["mousepad", "gaming", "mouse accessory", "desk", "computer"],
    thumbnail: "https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU016"
  },
  {
    title: "WristComfort Gel Rest",
    description: "Ergonomic gel wrist rest for keyboard and mouse",
    brand: "ErgoTech",
    price: 499,
    stock: 60,
    category: "Accessories",
    tags: ["wrist rest", "ergonomic", "keyboard accessory", "comfort", "office"],
    thumbnail: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU017"
  },
  {
    title: "HubMax 7-Port USB Hub",
    description: "Powered USB 3.0 hub with 7 ports for multiple devices",
    brand: "TechCore",
    price: 1299,
    stock: 30,
    category: "Electronics",
    tags: ["usb hub", "usb", "computer accessory", "laptop accessory", "connectivity"],
    thumbnail: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU018"
  },

  // === MOBILE & SMARTPHONES ===
  {
    title: "Galaxy Pro 5G Smartphone",
    description: "Flagship 5G smartphone with 128GB storage and triple camera",
    brand: "TechMobile",
    price: 45000,
    stock: 15,
    category: "Electronics",
    tags: ["smartphone", "phone", "5G", "mobile", "android"],
    thumbnail: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU019"
  },
  {
    title: "ArmorCase Pro",
    description: "Military-grade drop protection phone case",
    brand: "Protect+",
    price: 899,
    stock: 45,
    category: "Accessories",
    tags: ["phone case", "case", "phone accessory", "protection", "mobile"],
    thumbnail: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU020"
  },
  {
    title: "CrystalShield Screen Protector",
    description: "Tempered glass screen protector with oleophobic coating",
    brand: "Protect+",
    price: 299,
    stock: 80,
    category: "Accessories",
    tags: ["screen protector", "phone accessory", "glass", "protection", "mobile"],
    thumbnail: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU021"
  },
  {
    title: "FastCharge 65W Adapter",
    description: "Quick charge USB-C adapter with cable",
    brand: "PowerMax",
    price: 1499,
    stock: 55,
    category: "Electronics",
    tags: ["charger", "fast charge", "phone accessory", "usb-c", "adapter"],
    thumbnail: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU022"
  },

  // === AUDIO (earphones, headphones) ===
  {
    title: "BassMax Wireless Earphones",
    description: "True wireless earbuds with active noise cancellation",
    brand: "AudioPro",
    price: 3999,
    stock: 35,
    category: "Electronics",
    tags: ["earphones", "wireless", "earbuds", "anc", "audio", "phone accessory"],
    thumbnail: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU023"
  },
  {
    title: "StudioPro Over-Ear Headphones",
    description: "Professional studio-grade over-ear headphones",
    brand: "AudioPro",
    price: 8999,
    stock: 18,
    category: "Electronics",
    tags: ["headphone", "headphones", "over-ear", "studio", "audio"],
    thumbnail: "https://images.unsplash.com/photo-1545127398-14699f92334b?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU024"
  },
  {
    title: "HeadStand Pro",
    description: "Aluminum headphone stand with cable organizer",
    brand: "AudioPro",
    price: 799,
    stock: 40,
    category: "Accessories",
    tags: ["headphone stand", "stand", "headphone accessory", "organizer", "desk"],
    thumbnail: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU025"
  },

  // === FRAGRANCE & GROOMING ===
  {
    title: "FreshWave Deodorant Spray",
    description: "Long-lasting 24-hour protection deodorant spray",
    brand: "LuxScent",
    price: 349,
    stock: 70,
    category: "Beauty",
    tags: ["deodorant", "body spray", "fragrance", "grooming", "men"],
    thumbnail: "https://images.unsplash.com/photo-1599557303257-e0dffe9e7d0d?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU026"
  },
  {
    title: "Noir Intense Cologne",
    description: "Sophisticated evening cologne with woody notes",
    brand: "LuxScent",
    price: 2799,
    stock: 22,
    category: "Beauty",
    tags: ["cologne", "fragrance", "perfume", "men", "luxury"],
    thumbnail: "https://images.unsplash.com/photo-1588405748879-acb4655075d8?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU027"
  },
  {
    title: "SilkTouch Body Spray",
    description: "Refreshing body mist with floral notes",
    brand: "SkinLab",
    price: 599,
    stock: 50,
    category: "Beauty",
    tags: ["body spray", "fragrance", "mist", "women", "floral"],
    thumbnail: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU028"
  },

  // === WATCHES & ACCESSORIES ===
  {
    title: "TimeZone Chronograph Watch",
    description: "Stainless steel chronograph watch with sapphire crystal",
    brand: "TimeMaster",
    price: 12999,
    stock: 12,
    category: "Accessories",
    tags: ["watch", "chronograph", "accessories", "luxury", "timepiece"],
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU029"
  },
  {
    title: "LeatherLux Watch Strap",
    description: "Genuine leather replacement watch strap - 22mm",
    brand: "TimeMaster",
    price: 999,
    stock: 35,
    category: "Accessories",
    tags: ["watch strap", "strap", "watch accessory", "leather", "replacement"],
    thumbnail: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU030"
  },
  {
    title: "LuxBox Watch Storage Case",
    description: "Premium watch storage box for 6 watches",
    brand: "TimeMaster",
    price: 2499,
    stock: 20,
    category: "Accessories",
    tags: ["watch box", "storage", "watch accessory", "organizer", "case"],
    thumbnail: "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU031"
  },

  // === APPAREL (shirts, t-shirts, clothing) ===
  {
    title: "ClassicFit Cotton Shirt",
    description: "Formal cotton shirt for office and events - Blue",
    brand: "Elegance",
    price: 1299,
    stock: 40,
    category: "Apparel",
    tags: ["shirt", "formal", "clothing", "cotton", "men", "office"],
    thumbnail: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU032"
  },
  {
    title: "UrbanStyle Graphic T-Shirt",
    description: "Comfortable cotton t-shirt with modern graphic print",
    brand: "Streetwear",
    price: 699,
    stock: 60,
    category: "Apparel",
    tags: ["t-shirt", "tshirt", "casual", "clothing", "cotton", "graphic"],
    thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU033"
  },
  {
    title: "DenimPro Slim Fit Jeans",
    description: "Slim fit stretchable denim jeans - Dark blue",
    brand: "Streetwear",
    price: 1999,
    stock: 35,
    category: "Apparel",
    tags: ["jeans", "denim", "clothing", "pants", "casual"],
    thumbnail: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU034"
  },
  {
    title: "SilkLux Formal Tie",
    description: "Premium silk tie for formal occasions",
    brand: "Elegance",
    price: 799,
    stock: 45,
    category: "Accessories",
    tags: ["tie", "formal", "accessory", "shirt accessory", "silk"],
    thumbnail: "https://images.unsplash.com/photo-1589756823695-278bc31f93eb?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU035"
  },
  {
    title: "LeatherCraft Belt",
    description: "Genuine leather belt with classic buckle",
    brand: "Elegance",
    price: 1199,
    stock: 40,
    category: "Accessories",
    tags: ["belt", "leather", "accessory", "formal", "casual"],
    thumbnail: "https://images.unsplash.com/photo-1624222247344-550fb60583f2?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU036"
  },
  {
    title: "SnapBack Urban Cap",
    description: "Adjustable snapback cap with embroidered logo",
    brand: "Streetwear",
    price: 599,
    stock: 55,
    category: "Accessories",
    tags: ["cap", "hat", "accessory", "casual", "streetwear"],
    thumbnail: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU037"
  },
  {
    title: "ShadeMax Aviator Sunglasses",
    description: "Classic aviator sunglasses with UV protection",
    brand: "VisionPro",
    price: 1499,
    stock: 30,
    category: "Accessories",
    tags: ["sunglasses", "eyewear", "accessory", "uv protection", "fashion"],
    thumbnail: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU038"
  },
  {
    title: "FormalElite Blazer",
    description: "Tailored fit blazer for formal and business occasions",
    brand: "Elegance",
    price: 4999,
    stock: 18,
    category: "Apparel",
    tags: ["blazer", "jacket", "formal", "clothing", "business"],
    thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU039"
  },

  // === FOOTWEAR ===
  {
    title: "RunPro Athletic Shoes",
    description: "Lightweight running shoes with cushioned sole",
    brand: "SportFit",
    price: 3499,
    stock: 28,
    category: "Footwear",
    tags: ["shoes", "running", "athletic", "sports", "footwear"],
    thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU040"
  },
  {
    title: "CleanKit Shoe Cleaner",
    description: "Professional shoe cleaning solution with brush",
    brand: "SportFit",
    price: 399,
    stock: 65,
    category: "Accessories",
    tags: ["shoe cleaner", "cleaner", "shoe accessory", "cleaning", "care"],
    thumbnail: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU041"
  },
  {
    title: "ColorLux Shoe Laces (Pair)",
    description: "Premium round shoe laces - Multiple colors available",
    brand: "SportFit",
    price: 149,
    stock: 100,
    category: "Accessories",
    tags: ["shoe laces", "laces", "shoe accessory", "replacement", "colorful"],
    thumbnail: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU042"
  },
  {
    title: "ComfortPlus Cotton Socks (Pack of 3)",
    description: "Breathable cotton socks with cushioned sole",
    brand: "SportFit",
    price: 299,
    stock: 80,
    category: "Apparel",
    tags: ["socks", "clothing", "cotton", "footwear accessory", "comfort"],
    thumbnail: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU043"
  },
  {
    title: "GelSupport Shoe Insoles",
    description: "Orthopedic gel insoles for extra comfort and support",
    brand: "SportFit",
    price: 599,
    stock: 45,
    category: "Accessories",
    tags: ["insoles", "shoe accessory", "comfort", "orthopedic", "support"],
    thumbnail: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU044"
  },

  // === LAPTOP ACCESSORIES (to complete the laptop ecosystem) ===
  {
    title: "DataVault 1TB External SSD",
    description: "Portable external SSD with USB 3.1 Gen 2 for fast transfers",
    brand: "DataPro",
    price: 7999,
    stock: 20,
    category: "Electronics",
    tags: ["external drive", "ssd", "storage", "laptop accessory", "portable"],
    thumbnail: "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU045"
  },
  {
    title: "CoolFlow Laptop Cooling Pad",
    description: "Dual-fan cooling pad for laptops up to 17 inches",
    brand: "TechCore",
    price: 1499,
    stock: 32,
    category: "Accessories",
    tags: ["cooling pad", "laptop accessory", "fan", "cooling", "gaming"],
    thumbnail: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU046"
  },

  // === CAMERA ACCESSORIES (to complete camera ecosystem) ===
  {
    title: "StablePro Camera Tripod",
    description: "Aluminum tripod with ball head for cameras and smartphones",
    brand: "LensCraft",
    price: 2999,
    stock: 22,
    category: "Accessories",
    tags: ["tripod", "camera accessory", "stand", "photography", "stable"],
    thumbnail: "https://images.unsplash.com/photo-1606956261160-af284a3afb8d?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU047"
  },
  {
    title: "TeleMax 50mm Prime Lens",
    description: "F1.8 prime lens for stunning portrait photography",
    brand: "LensCraft",
    price: 18999,
    stock: 8,
    category: "Electronics",
    tags: ["lens", "camera", "photography", "prime lens", "portrait"],
    thumbnail: "https://images.unsplash.com/photo-1606956261160-af284a3afb8d?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU048"
  },

  // === DESK/OFFICE ACCESSORIES ===
  {
    title: "BrightDesk LED Lamp",
    description: "Adjustable LED desk lamp with touch control and USB charging port",
    brand: "BrightHome",
    price: 1999,
    stock: 25,
    category: "Smart Home",
    tags: ["desk lamp", "led", "lamp", "office", "lighting", "keyboard accessory"],
    thumbnail: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=400",
    user: new mongoose.Types.ObjectId(),
    sku: "SKU049"
  }
];

async function seed() {
  try {
    // Connect to the correct database 'videotube'
    await mongoose.connect(`${process.env.MONGODB_URI}/videotube`);
    console.log("Connected to MongoDB");

    // Insert only new products (don't delete existing ones)
    await Product.deleteMany({});
    const result = await Product.insertMany(expandedProducts);
    console.log(`✅ Added ${result.length} new products`);

    const totalCount = await Product.countDocuments();
    console.log(`📦 Total products in database: ${totalCount}`);

    // Show category breakdown
    const categories = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log("\n📊 Products by category:");
    categories.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} items`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
