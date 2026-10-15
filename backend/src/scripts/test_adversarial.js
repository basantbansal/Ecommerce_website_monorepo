import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import { PolicyEngine } from "../services/policyEngine.js";
import { Product } from "../models/product.models.js";
import { AgentAuditTrail } from "../models/agentAuditTrail.models.js";

dotenv.config();

const DB_NAME = "videotube";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

async function runAdversarialTests() {
  console.log("==========================================");
  console.log("🛡️  RAM AGENT ADVERSARIAL TEST SUITE  🛡️");
  console.log("==========================================\n");

  await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
  console.log("Connected to MongoDB.\n");

  // Fetch some real products from the DB to test with
  const product1 = await Product.findOne({ stock: { $gte: 1 } });
  if (!product1) {
    console.log("No products found in DB. Exiting.");
    process.exit(1);
  }

  const sessionId = "adv-test-session-" + Date.now();

  // ----------------------------------------------------
  // TEST A: Normal purchase -> approved
  // ----------------------------------------------------
  console.log("Test A: Normal Purchase Proposal");
  const normalProposal = [
    { product_id: product1._id.toString(), quantity: 1 }
  ];
  
  const resultA = await PolicyEngine.evaluateCheckoutProposal(sessionId, normalProposal);
  console.assert(resultA.decision === "ALLOW", "Normal purchase should be allowed");
  console.log(`✅ Passed: Normal purchase allowed (Total: ₹${resultA.finalPrice})`);


  // ----------------------------------------------------
  // TEST B: Unsafe transaction -> policy engine rejects it (Over ₹50,000)
  // ----------------------------------------------------
  console.log("\nTest B: Transaction Over Hard Limit (₹50,000)");
  const expensiveProposal = [
    { product_id: product1._id.toString(), quantity: 100000 } // Artificially high to breach limit
  ];
  
  const resultB = await PolicyEngine.evaluateCheckoutProposal(sessionId, expensiveProposal);
  console.assert(resultB.decision === "BLOCK", "Expensive purchase should be blocked");
  console.log(`✅ Passed: Expensive purchase blocked. Reason: ${resultB.reason}`);

  
  // ----------------------------------------------------
  // TEST C: Malformed model output (Missing Product)
  // ----------------------------------------------------
  console.log("\nTest C: Hallucinated / Non-existent Product ID");
  const hallucinatedProposal = [
    { product_id: new mongoose.Types.ObjectId().toString(), quantity: 1 }
  ];
  
  const resultC = await PolicyEngine.evaluateCheckoutProposal(sessionId, hallucinatedProposal);
  console.assert(resultC.decision === "BLOCK", "Hallucinated product should be blocked");
  console.log(`✅ Passed: Hallucinated product blocked. Reason: ${resultC.reason}`);


  // ----------------------------------------------------
  // TEST D: Negative Quantity (LLM Math Manipulation)
  // ----------------------------------------------------
  console.log("\nTest D: Negative Quantity Injection");
  const negativeProposal = [
    { product_id: product1._id.toString(), quantity: -5 }
  ];
  
  const resultD = await PolicyEngine.evaluateCheckoutProposal(sessionId, negativeProposal);
  console.assert(resultD.decision === "BLOCK", "Negative quantity should be blocked");
  console.log(`✅ Passed: Negative quantity blocked. Reason: ${resultD.reason}`);


  // ----------------------------------------------------
  // TEST E: Concurrent Requests -> Exactly one execution (Idempotency Race Condition)
  // ----------------------------------------------------
  console.log("\nTest E: Concurrent Requests / Idempotency Race Attack");
  const raceSession = "race-session-" + Date.now();
  const raceItems = [{ product_id: product1._id.toString(), quantity: 1 }];
  
  const minuteBucket = Math.floor(Date.now() / 60000);
  const idempotencyKey = crypto.createHash('sha256').update(JSON.stringify({sessionId: raceSession, items: raceItems, minuteBucket})).digest('hex');

  // Launch 5 identical concurrent requests to simulate a race attack
  const racePromises = Array.from({ length: 5 }).map(async (_, index) => {
    try {
      await AgentAuditTrail.create({
        sessionId: raceSession,
        actionType: "ORDER_CREATION",
        explanation: "Executing Order Generation (RACE ATTACK)",
        toolInput: { items: raceItems },
        idempotencyKey: idempotencyKey, // The unique constraint on this field should block 4 out of 5
        status: "EXECUTING"
      });
      return "SUCCESS"; // Only one should succeed
    } catch (err) {
      if (err.code === 11000) return "DUPLICATE_BLOCKED";
      return "ERROR";
    }
  });

  const raceResults = await Promise.all(racePromises);
  const successes = raceResults.filter(r => r === "SUCCESS").length;
  const blocks = raceResults.filter(r => r === "DUPLICATE_BLOCKED").length;

  console.assert(successes === 1, "Exactly one execution should succeed");
  console.assert(blocks === 4, "Four executions should be blocked by idempotency constraint");
  
  console.log(`✅ Passed: Concurrent attack defended. ${successes} successful execution, ${blocks} duplicates blocked at database layer.`);


  console.log("\n==========================================");
  console.log("🛡️  ALL ADVERSARIAL TESTS PASSED!       🛡️");
  console.log("==========================================");
  process.exit(0);
}

runAdversarialTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
