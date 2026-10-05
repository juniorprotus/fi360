import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { validateEnv } from "./config/env";
import { connectDB, isDbConnected, disconnectDB } from "./config/db";
import { vehicleRoutes } from "./modules/vehicle/vehicle.routes";
import { driverRoutes } from "./modules/drivers/driver.routes";
import { maintenanceRoutes } from "./modules/maintenance/maintenance.routes";
import { organizationRoutes } from "./modules/organization/organization.routes";

// Load .env file first
dotenv.config();

// Validate environment variables at startup
const config = validateEnv();
const PORT = config.PORT || "5000";

const app = express();
const startTime = Date.now();

// 1. Security & Standard Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow uptime bots, mobile, curl (no origin header)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        config.FRONTEND_URL,
      ].filter(Boolean) as string[];

      // Vercel preview URLs follow pattern: *.vercel.app
      const isVercelPreview = origin.endsWith(".vercel.app");
      const isAllowed = allowedOrigins.some((allowed) =>
        origin.startsWith(allowed)
      );

      return callback(null, isAllowed || isVercelPreview);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));

// 2. Anti-Hibernation Health Check (Render Free-Tier Strategy)
// ============================================================
// cron-job.org pings this every 14 minutes to prevent Render cold starts.
// This endpoint MUST remain fast and never depend on DB connectivity.
app.get("/api/health", (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const dbStatus = isDbConnected() ? "connected" : "offline_fallback";

  res.status(200).json({
    status: "ok",
    service: "fi360-backend",
    version: "1.0.0",
    environment: config.NODE_ENV,
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
    database: dbStatus,
    modules: {
      vehicles: "active",
      drivers: "active",
      maintenance: "active",
      organizations: "active",
      ai: config.GEMINI_API_KEY ? "active" : "standby",
    },
  });
});

// Root discovery endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Fleet Intelligence 360 (FI360) API",
    version: "1.0.0",
    status: "operational",
    docs: "/api/health",
    endpoints: [
      "/api/health",
      "/api/organizations",
      "/api/vehicles",
      "/api/drivers",
      "/api/maintenance",
    ],
  });
});

// 3. Modular API Subsystems
app.use("/api/organizations", organizationRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/maintenance", maintenanceRoutes);

// 4. 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found. See GET / for available routes.",
  });
});

// 5. Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: config.NODE_ENV === "production" ? undefined : err.message,
  });
});

// 6. Connect to MongoDB Atlas, then start server
connectDB().finally(() => {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 FI360 Backend running on port ${PORT}`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
    console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
    console.log(`📦 DB: ${isDbConnected() ? "✅ MongoDB Atlas" : "⚠️ Offline Fallback"}\n`);
  });

  // Graceful shutdown on Render restart / SIGTERM
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  });
});

export default app;
