import { Product } from "../models/product.models.js";
import { AgentAuditTrail } from "../models/agentAuditTrail.models.js";

/**
 * Deterministic Policy Engine for the RAM AI Agent.
 * Ensures that all financial transactions follow strict rules before execution.
 * The LLM CANNOT bypass this.
 */
export const PolicyEngine = {
  async evaluateCheckoutProposal(sessionId, items) {
    let policyResult = {
      decision: "ALLOW",
      reason: "",
      validItems: [],
      calculatedTotal: 0,
      discountPercentage: 0,
      finalPrice: 0,
    };

    try {
      // RULE 1: Session Limits (Max 3 orders per session)
      const sessionOrderCount = await AgentAuditTrail.countDocuments({
        sessionId: sessionId,
        actionType: "ORDER_CREATION",
        status: "SUCCESS",
      });

      if (sessionOrderCount >= 3) {
        policyResult.decision = "BLOCK";
        policyResult.reason = "Exceeded maximum of 3 orders per session.";
        return policyResult;
      }

      // RULE 2: Validate Items, Stock, and Calculate Totals server-side
      if (!items || items.length === 0) {
        policyResult.decision = "BLOCK";
        policyResult.reason = "Checkout proposal contains no items.";
        return policyResult;
      }

      let rawTotal = 0;
      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          policyResult.decision = "BLOCK";
          policyResult.reason = "Invalid quantity or missing product_id.";
          return policyResult;
        }

        const product = await Product.findById(item.product_id);
        if (!product) {
          policyResult.decision = "BLOCK";
          policyResult.reason = `Product ${item.product_id} does not exist.`;
          return policyResult;
        }

        if (product.stock < item.quantity) {
          policyResult.decision = "BLOCK";
          policyResult.reason = `Insufficient stock for ${product.title}. Requested ${item.quantity}, available ${product.stock}.`;
          return policyResult;
        }

        rawTotal += product.price * item.quantity;
        policyResult.validItems.push({
          product: product,
          quantity: item.quantity,
          priceAtPurchase: product.price,
        });
      }

      // RULE 3: Deterministic Discount Calculation
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalItems >= 3) {
        policyResult.discountPercentage = 15;
      } else if (totalItems === 2) {
        policyResult.discountPercentage = 10;
      } else if (totalItems === 1) {
        policyResult.discountPercentage = 5;
      } else {
        policyResult.discountPercentage = 0;
      }

      policyResult.calculatedTotal = rawTotal;
      const discountAmount = rawTotal * (policyResult.discountPercentage / 100);
      policyResult.finalPrice = Math.round((rawTotal - discountAmount) * 100) / 100;

      // RULE 4: Max transaction amount (Hard cap at ₹50,000 INR)
      if (policyResult.finalPrice > 50000) {
        policyResult.decision = "BLOCK";
        policyResult.reason = `Order total ₹${policyResult.finalPrice} exceeds the maximum allowed limit of ₹50,000.`;
        return policyResult;
      }

      return policyResult;
    } catch (error) {
      policyResult.decision = "ESCALATE";
      policyResult.reason = `System error during policy evaluation: ${error.message}`;
      return policyResult;
    }
  },
};
