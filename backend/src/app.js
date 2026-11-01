import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { rateLimit } from 'express-rate-limit';
import userRoute from "./routes/user.route.js";
import productRoute from "./routes/product.route.js";
import cartRoute from "./routes/cart.route.js";
import orderRoute from "./routes/order.route.js";
import paymentRoute from "./routes/payment.route.js";
import agentRoute from "./routes/agent.route.js";
import client from 'prom-client';


const app = express();
app.set("trust proxy", 1);


// Collect default system metrics (CPU, RAM, Event Loop) every 5 seconds
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Expose the /metrics endpoint strictly for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});


// Measure request duration & status codes
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5] // duration buckets in seconds
});

// Middleware to track request timings
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ route: req.route?.path || req.path, code: res.statusCode, method: req.method });
  });
  next();
});

// Trust first proxy hop for reverse proxy environments (e.g. Render)
// This ensures express-rate-limit correctly resolves client IP from X-Forwarded-For

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://e-commerce-website-ten-dusky.vercel.app",
  "https://e-commerce-website-9jgzblrxv-basantbansals-projects.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      defaultAllowedOrigins.includes(origin) ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/e-commerce-website-[a-z0-9-]+\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true)
    }

    return callback(new Error("Not allowed by CORS"))
  },
  credentials: true
}));


app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
  }
});

// Apply rate limiter to all API routes
app.use("/api", apiLimiter);

app.get("/api/v1/health", (_, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.set("Cache-Control", "no-store");
  return res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    status: databaseConnected ? "ok" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// routes declaration
app.use("/api/v1/users", userRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/payments", paymentRoute);
app.use("/api/v1/agent", agentRoute);

app.use((err, _, res, __) => {
  const statusCode = err?.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err?.message || "Internal Server Error",
    errors: err?.errors || [],
  });
});

export { app };
