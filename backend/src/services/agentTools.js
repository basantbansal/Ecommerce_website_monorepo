import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Razorpay from "razorpay";
import { Product } from "../models/product.models.js";
import { AgentAuditTrail } from "../models/agentAuditTrail.models.js";
import { Order } from "../models/order.models.js";
import { Payment } from "../models/payment.models.js";
import crypto from "crypto";
import { PolicyEngine } from "./policyEngine.js";

// FIX [2026-09-01]: Added escapeRegex to prevent Regular Expression Denial of Service (ReDoS).
// Old error: User/LLM input was passed directly into MongoDB $regex queries without escaping, allowing arbitrary regex execution.
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Tool: Search Catalog
export const searchCatalogTool = tool(
  async ({ query, max_price, category }, context) => {
    try {
      const dbQuery = {
        availabilityStatus: "In Stock",
      };

      if (query) {
        // Split by common separators to handle queries like "keyboard and mouse"
        const searchTerms = query.split(/\s+and\s+|\s*,\s*|\s*&\s*/i).map(t => t.trim()).filter(Boolean);
        
        if (searchTerms.length > 0) {
          const termConditions = searchTerms.map(term => {
            const safeTerm = escapeRegex(term);
            return {
              $or: [
                { title: { $regex: safeTerm, $options: "i" } },
                { description: { $regex: safeTerm, $options: "i" } },
                { tags: { $regex: safeTerm, $options: "i" } },
                { brand: { $regex: safeTerm, $options: "i" } },
              ]
            };
          });
          
          dbQuery.$or = termConditions;
        }
      }
      
      if (category) {
        dbQuery.category = { $regex: escapeRegex(category), $options: "i" };
      }

      if (max_price) {
        dbQuery.price = { $lte: max_price };
      }

      const products = await Product.find(dbQuery).select("title price category stock description thumbnail images tags").limit(10);
      
      // Log Action
      await AgentAuditTrail.create({
        sessionId: context?.configurable?.sessionId || "anonymous",
        actionType: "SEARCH",
        explanation: `Searched for ${query || "items"}`,
        toolInput: { query, max_price, category },
        toolOutput: { resultsCount: products.length },
        status: "SUCCESS"
      });

      if (products.length === 0) {
        return "No products found matching the criteria.";
      }

      // Sanitization function for indirect prompt injection defense
      const sanitizeText = (text, maxLength) => {
        if (!text) return "";
        // Strip HTML tags
        let cleanText = text.toString().replace(/<[^>]*>?/gm, '');
        // Strip system instruction patterns
        const badPatterns = /^(system|ignore|forget|override|instruction|admin|developer|bypass|prompt)[\s:\]\*_-]/i;
        cleanText = cleanText.replace(badPatterns, '***');
        // Strip them anywhere if surrounded by brackets/stars like [SYSTEM] or **IGNORE**
        const embeddedPatterns = /[\[\(\*\_]*(system|ignore|forget|override|instruction|admin|developer|bypass|prompt)[\]\)\*\_]*[\s:]/gi;
        cleanText = cleanText.replace(embeddedPatterns, '*** ');
        
        if (cleanText.length > maxLength) {
          return cleanText.substring(0, maxLength) + "...";
        }
        return cleanText;
      };

      const formattedProducts = products.map(p => {
        return {
          id: p._id,
          title: sanitizeText(p.title, 120),
          description: sanitizeText(p.description, 400),
          price: p.price,
          category: sanitizeText(p.category, 50),
          brand: sanitizeText(p.brand, 80),
          tags: (p.tags || []).map(t => sanitizeText(t, 40)).slice(0, 10),
          image: p.thumbnail || (p.images && p.images.length > 0 ? p.images[0] : "https://via.placeholder.com/150")
        };
      });

      return JSON.stringify(formattedProducts);
    } catch (error) {
       await AgentAuditTrail.create({
        sessionId: context?.configurable?.sessionId || "anonymous",
        actionType: "SEARCH",
        explanation: "Error searching catalog",
        toolInput: { query, max_price, category },
        toolOutput: { error: error.message },
        status: "FAILED"
      });
      return `Error searching catalog: ${error.message}`;
    }
  },
  {
    name: "search_catalog",
    description: "Search the product catalog for items by query, maximum price, or category. Returns a list of matching products.",
    schema: z.object({
      query: z.string().optional().describe("Search keyword for product title or description."),
      max_price: z.number().optional().describe("Maximum price in INR."),
      category: z.string().optional().describe("Category of the product."),
    }),
  }
);

// Tool: Evaluate Bundle Discount
export const evaluateBundleDiscountTool = tool(
  async ({ product_ids }, context) => {
    try {
      if (!product_ids || product_ids.length < 2) {
        return "Bundle discount requires at least 2 items.";
      }

      const products = await Product.find({ _id: { $in: product_ids } });
      
      if (products.length !== product_ids.length) {
        return "One or more products could not be found.";
      }

      let discountPercentage = 0;
      
      // Bounded limit logic: max 15% discount
      if (products.length === 2) discountPercentage = 5;
      else if (products.length === 3) discountPercentage = 10;
      else if (products.length >= 4) discountPercentage = 15;

      const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
      const discountAmount = (totalPrice * discountPercentage) / 100;
      const finalPrice = totalPrice - discountAmount;

      await AgentAuditTrail.create({
        sessionId: context?.configurable?.sessionId || "anonymous",
        actionType: "DISCOUNT_EVALUATION",
        explanation: `Evaluated bundle of ${products.length} items. Policy applied: ${discountPercentage}%`,
        toolInput: { product_ids },
        toolOutput: { discountPercentage, totalPrice, finalPrice },
        status: "SUCCESS"
      });

      return JSON.stringify({
        message: `Approved ${discountPercentage}% bundle discount.`,
        discountPercentage,
        originalTotalPrice: totalPrice,
        finalPrice,
        currency: "INR"
      });

    } catch (error) {
       await AgentAuditTrail.create({
        sessionId: context?.configurable?.sessionId || "anonymous",
        actionType: "DISCOUNT_EVALUATION",
        explanation: "Error evaluating bundle",
        toolInput: { product_ids },
        toolOutput: { error: error.message },
        status: "FAILED"
      });
      return `Error evaluating bundle discount: ${error.message}`;
    }
  },
  {
    name: "evaluate_bundle_discount",
    description: "Evaluates a discount for buying multiple items together. Give it an array of product IDs.",
    schema: z.object({
      product_ids: z.array(z.string()).describe("Array of MongoDB Object IDs of the products to bundle."),
    }),
  }
);

// Tool: Create Razorpay Order
export const createRazorpayOrderTool = tool(
  async ({ items, applied_discount }, context) => {
    try {
      const sessionId = context?.configurable?.sessionId || "anonymous";
      const userId = context?.configurable?.userId;

      if (!userId) {
        return "User is not logged in or userId is missing from context.";
      }

      // Log proposal
      await AgentAuditTrail.create({
        sessionId,
        actionType: "ORDER_CREATION",
        explanation: "LLM Proposed Checkout",
        toolInput: { items, applied_discount },
        status: "PROPOSED"
      });

      // 1. DETERMINISTIC POLICY ENGINE
      const policyResult = await PolicyEngine.evaluateCheckoutProposal(sessionId, items);
      
      if (policyResult.decision === "BLOCK") {
        await AgentAuditTrail.create({
          sessionId: sessionId,
          actionType: "ORDER_CREATION",
          explanation: `Policy Engine Blocked: ${policyResult.reason}`,
          toolInput: { items, policyResult },
          status: "BLOCKED"
        });
        return `Order rejected by safety policy: ${policyResult.reason}`;
      }

      const { validItems, finalPrice, discountPercentage } = policyResult;

      // 2. ATOMIC IDEMPOTENCY CHECK
      // We use a 1-minute time bucket to prevent duplicate rapid requests for the exact same items
      const minuteBucket = Math.floor(Date.now() / 60000);
      const idempotencyKey = crypto.createHash('sha256').update(JSON.stringify({sessionId, items, minuteBucket})).digest('hex');

      let auditLog;
      try {
        auditLog = await AgentAuditTrail.create({
          sessionId,
          actionType: "ORDER_CREATION",
          explanation: "Executing Order Generation",
          toolInput: { items },
          idempotencyKey: idempotencyKey,
          status: "EXECUTING"
        });
      } catch (err) {
        if (err.code === 11000) {
          return "Order rejected: A duplicate request is already processing. Please wait.";
        }
        throw err;
      }

      // 3. DATABASE STATE TRANSITION
      const dbOrder = await Order.create({
        user: userId,
        items: validItems.map(item => ({ product: item.product._id, quantity: item.quantity, price: item.priceAtPurchase })),
        total: finalPrice,
        status: "pending_payment"
      });

      const dbPayment = await Payment.create({
        user: userId,
        order: dbOrder._id,
        amount: finalPrice,
        currency: "INR",
        status: "pending"
      });

      // Razorpay expects amount in smallest currency unit (paise)
      const amountInPaise = Math.round(finalPrice * 100);

      // 4. RAZORPAY EXECUTION
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `order_${dbOrder._id.toString().slice(-24)}`,
        notes: {
          sessionId: sessionId,
          agentGenerated: "true",
          orderId: dbOrder._id.toString(),
          paymentId: dbPayment._id.toString()
        }
      };

      const razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
        headers: {
          "X-Idempotency-Key": idempotencyKey
        }
      });

      const order = await razorpayInstance.orders.create(options);
      
      // 5. UPDATE STATE
      dbPayment.provider = "razorpay";
      dbPayment.providerOrderId = order.id;
      await dbPayment.save();
      
      dbOrder.payment = dbPayment._id;
      await dbOrder.save();

      auditLog.explanation = `Created Razorpay Order ${order.id} for ₹${finalPrice} with ${discountPercentage}% discount`;
      auditLog.toolOutput = { orderId: order.id, finalPrice, discountPercentage, dbOrderId: dbOrder._id };
      auditLog.status = "SUCCESS";
      await auditLog.save();

      return JSON.stringify({
        message: "Razorpay order created successfully.",
        orderId: order.id,
        finalPrice,
        currency: "INR",
        items: validItems.map(vi => ({ title: vi.product.title, quantity: vi.quantity })),
        appliedDiscountPercentage: discountPercentage
      });

    } catch (error) {
       await AgentAuditTrail.create({
        sessionId: context?.configurable?.sessionId || "anonymous",
        actionType: "ORDER_CREATION",
        explanation: "Error creating Razorpay Order",
        toolInput: { items },
        toolOutput: { error: error.message },
        status: "FAILED"
      });
      return `Graceful failure: We encountered an error generating your payment link (${error.message}). Please try again or checkout manually from your cart.`;
    }
  },
  {
    name: "create_razorpay_order",
    description: "Creates a Razorpay order for the selected items. Discount is automatically calculated server-side based on the number of items.",
    schema: z.object({
      items: z.array(
        z.object({
          product_id: z.string(),
          quantity: z.number().min(1),
        })
      ).describe("Array of items to purchase."),
      applied_discount: z.number().optional().describe("Discount percentage requested by agent."),
    }),
  }
);

// Tool: Suggest Smart Combos
export const suggestSmartCombosTool = tool(
  async ({ primary_product_id, category, dynamic_search_terms }, context) => {
    try {
      // Combo mapping based on categories
      const comboMap = {
        'fragrance': ['deodorant', 'lotion', 'cologne', 'body spray'],
        'perfume': ['deodorant', 'lotion', 'cologne', 'body spray'],
        'mouse': ['keyboard', 'mousepad', 'usb hub', 'wrist rest'],
        'keyboard': ['mouse', 'mousepad', 'wrist rest', 'desk lamp'],
        'laptop': ['laptop bag', 'mouse', 'external drive', 'cooling pad'],
        'phone': ['phone case', 'screen protector', 'earphones', 'charger'],
        'smartphone': ['phone case', 'screen protector', 'earphones', 'charger'],
        'camera': ['memory card', 'tripod', 'camera bag', 'lens'],
        'headphone': ['headphone stand', 'aux cable', 'carrying case'],
        'watch': ['watch strap', 'watch box', 'cleaning kit'],
        'shoes': ['shoe cleaner', 'shoe laces', 'socks', 'insoles'],
        'shirt': ['tie', 'belt', 'watch', 'blazer'],
        't-shirt': ['jeans', 'cap', 'sunglasses'],
      };

      const primaryProduct = await Product.findById(primary_product_id);
      if (!primaryProduct) {
        return "Primary product not found.";
      }

      // Determine complementary categories
      let complementaryTerms = [];
      
      if (dynamic_search_terms && dynamic_search_terms.length > 0) {
        // Use the LLM's dynamic suggestions if provided!
        complementaryTerms = dynamic_search_terms;
      } else {
        const lowerCategory = (category || primaryProduct.category || '').toLowerCase();
        const lowerTitle = primaryProduct.title.toLowerCase();
        const lowerTags = (primaryProduct.tags || []).map(t => t.toLowerCase());

        // Match by category, title, or tags
        for (const [key, values] of Object.entries(comboMap)) {
          if (lowerCategory.includes(key) || lowerTitle.includes(key) || lowerTags.some(t => t.includes(key))) {
            complementaryTerms = values;
            break;
          }
        }

        // If no specific match, suggest from same category
        if (complementaryTerms.length === 0) {
          complementaryTerms = [primaryProduct.category];
        }
      }

      // Search for complementary products
      const complementaryProducts = [];
      for (const term of complementaryTerms.slice(0, 3)) {
        const safeTerm = escapeRegex(term);
        const products = await Product.find({
          $or: [
            { title: { $regex: safeTerm, $options: 'i' } },
            { category: { $regex: safeTerm, $options: 'i' } },
            { tags: { $regex: safeTerm, $options: 'i' } }
          ],
          availabilityStatus: "In Stock",
          _id: { $ne: primary_product_id }
        }).limit(2);

        complementaryProducts.push(...products);
      }

      // Remove duplicates and limit to 3
      const uniqueProducts = [...new Map(complementaryProducts.map(p => [p._id.toString(), p])).values()].slice(0, 3);

      if (uniqueProducts.length === 0) {
        return JSON.stringify({
          message: "No complementary products found for this item.",
          suggestions: []
        });
      }

      await AgentAuditTrail.create({
        sessionId: context?.configurable?.sessionId || "anonymous",
        actionType: "SEARCH",
        explanation: `Suggested ${uniqueProducts.length} combo products for ${primaryProduct.title}`,
        toolInput: { primary_product_id, category },
        toolOutput: { count: uniqueProducts.length },
        status: "SUCCESS"
      });

      // Sanitization function
      const sanitizeText = (text, maxLength) => {
        if (!text) return "";
        let cleanText = text.toString().replace(/<[^>]*>?/gm, '');
        const badPatterns = /^(system|ignore|forget|override|instruction|admin|developer|bypass|prompt)[\s:\]\*_-]/i;
        cleanText = cleanText.replace(badPatterns, '***');
        const embeddedPatterns = /[\[\(\*\_]*(system|ignore|forget|override|instruction|admin|developer|bypass|prompt)[\]\)\*\_]*[\s:]/gi;
        cleanText = cleanText.replace(embeddedPatterns, '*** ');
        if (cleanText.length > maxLength) {
          return cleanText.substring(0, maxLength) + "...";
        }
        return cleanText;
      };

      const formattedSuggestions = uniqueProducts.map(p => ({
        id: p._id,
        title: sanitizeText(p.title, 120),
        price: p.price,
        category: sanitizeText(p.category, 50),
        image: p.thumbnail || (p.images && p.images.length > 0 ? p.images[0] : "https://via.placeholder.com/150")
      }));

      return JSON.stringify({
        primary: {
          id: primaryProduct._id,
          title: sanitizeText(primaryProduct.title, 120),
          price: primaryProduct.price,
          image: primaryProduct.thumbnail || (primaryProduct.images && primaryProduct.images.length > 0 ? primaryProduct.images[0] : "https://via.placeholder.com/150")
        },
        suggestions: formattedSuggestions,
        bundleDiscount: formattedSuggestions.length >= 1 ? (formattedSuggestions.length === 1 ? 5 : (formattedSuggestions.length === 2 ? 10 : 15)) : 0
      });

    } catch (error) {
      await AgentAuditTrail.create({
        sessionId: context?.configurable?.sessionId || "anonymous",
        actionType: "SEARCH",
        explanation: "Error suggesting combos",
        toolInput: { primary_product_id, category },
        toolOutput: { error: error.message },
        status: "FAILED"
      });
      return `Error suggesting combos: ${error.message}`;
    }
  },
  {
    name: "suggest_smart_combos",
    description: "Suggests complementary products that go well with a primary product for bundle discounts. Use this when user shows interest in ONE product and you want to upsell related items.",
    schema: z.object({
      primary_product_id: z.string().describe("The MongoDB Object ID of the primary product the user is interested in."),
      category: z.string().optional().describe("Category of the primary product to help find better matches."),
      dynamic_search_terms: z.array(z.string()).optional().describe("If the user's requirement implies specific combo items (like they want a mouse, and you know they need a mousepad and keyboard), pass those specific terms here instead of relying on the default categorizer."),
    }),
  }
);
