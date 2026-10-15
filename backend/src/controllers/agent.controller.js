import { executeAgent } from "../services/agentCore.js";
import { AgentAuditTrail } from "../models/agentAuditTrail.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Keep track of session chat history in-memory for the demo.
// In production, this should be stored in MongoDB or Redis.
const memoryHistory = {};

export const chatWithAgent = asyncHandler(async (req, res) => {
  const { message, sessionId = "default-session" } = req.body;

  if (!message) {
    return res.status(400).json(new ApiResponse(400, {}, "Message is required"));
  }

  if (!memoryHistory[sessionId]) {
    memoryHistory[sessionId] = [];
  }

  // Execute Agent
  const agentResponseText = await executeAgent(sessionId, message, memoryHistory[sessionId], req.user._id);

  // Update history
  memoryHistory[sessionId].push(["human", message]);
  memoryHistory[sessionId].push(["ai", agentResponseText]);

  // Extract a potential orderId from the most recent AuditTrail to guarantee we don't miss it if the LLM omits it.
  let orderId = null;
  const recentOrderLog = await AgentAuditTrail.findOne({
    sessionId,
    actionType: "ORDER_CREATION",
    status: "SUCCESS",
    createdAt: { $gte: new Date(Date.now() - 30000) } // Last 30 seconds
  }).sort({ createdAt: -1 });

  if (recentOrderLog && recentOrderLog.toolOutput && recentOrderLog.toolOutput.orderId) {
    orderId = recentOrderLog.toolOutput.orderId;
  } else {
    // Fallback to regex just in case
    const orderIdMatch = agentResponseText.match(/order_[a-zA-Z0-9]+/);
    if (orderIdMatch) {
      orderId = orderIdMatch[0];
    }
  }

  return res.status(200).json(
    new ApiResponse(200, {
      response: agentResponseText,
      orderId,
    }, "Agent responded successfully")
  );
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const logs = await AgentAuditTrail.find({ sessionId }).sort({ createdAt: -1 });
  
  return res.status(200).json(
    new ApiResponse(200, logs, "Audit logs fetched successfully")
  );
});
