import mongoose, { Schema } from "mongoose";

const agentAuditTrailSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ["SEARCH", "DISCOUNT_EVALUATION", "ORDER_CREATION", "RECOVERY", "CHAT"],
      required: true,
    },
    explanation: {
      type: String, // Reason for taking this action
    },
    toolInput: {
      type: Schema.Types.Mixed, // Storing any JSON input sent to the tool
    },
    toolOutput: {
      type: Schema.Types.Mixed, // Storing tool's resulting output or error
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    status: {
      type: String,
      enum: ["SUCCESS", "BLOCKED", "FAILED", "PROPOSED", "VALIDATED", "APPROVED", "PENDING", "EXECUTING", "ESCALATED"],
      required: true,
      default: "SUCCESS",
    },
  },
  {
    timestamps: true,
  }
);

export const AgentAuditTrail = mongoose.model("AgentAuditTrail", agentAuditTrailSchema);
