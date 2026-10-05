import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB, isDbConnected } from "./config/db";
import { vehicleRoutes } from "./modules/vehicle/vehicle.routes";
import { driverRoutes } from "./modules/drivers/driver.routes";
import { maintenanceRoutes } from "./modules/maintenance/maintenance.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const startTime = Date.now();

// 1. Security & Standard Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, uptime bots)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (allowedOrigins.some((allowed) => allowed && origin.startsWith(allowed as string))) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev/initial phase for cross-preview deployment
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// 2. Anti-Hibernation & Uptime Health Check Endpoint (Render Requirement)
// Pinged every 14 minutes by cron-job.org to prevent Render free-tier sleep
app.get("/api/health", (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: "ok",
    service: "fi360-backend",
    version: "1.0.0",
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
    database: isDbConnected() ? "connected" : "offline_fallback",
    modules: {
      vehicles: "active",
      drivers: "active",
      maintenance: "active",
      ai: "standby",
    },
  });
});

// Root welcome endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Fleet Intelligence 360 (FI360) API",
    status: "operational",
    docs: "/api/health",
  });
});

// 3. Mount Modular Subsystems
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/maintenance", maintenanceRoutes);

// 4. 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// 5. Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

// 6. Connect to MongoDB and start HTTP listener
connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`🚀 FI360 Backend running on port ${PORT}`);
    console.log(`🩺 Health check ready at http://localhost:${PORT}/api/health`);
  });
});

export default app;
