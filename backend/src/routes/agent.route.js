import { Router } from "express";
import { chatWithAgent, getAuditLogs } from "../controllers/agent.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Require authentication for all agent routes
router.post("/chat", verifyJWT, chatWithAgent);
router.get("/audit/:sessionId", verifyJWT, getAuditLogs);

export default router;
