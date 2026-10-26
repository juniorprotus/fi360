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
import { aiRoutes } from "./modules/ai/ai.routes";
import { tyreRoutes } from "./modules/tyres/tyre.routes";
import { fuelRoutes } from "./modules/fuel/fuel.routes";
import { inspectionRoutes } from "./modules/inspections/inspection.routes";
import { transportRoutes } from "./modules/transport/transport.routes";

import cookieParser from "cookie-parser";
import { authRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/auth/user.routes";
import { authenticate } from "./modules/auth/auth.middleware";
import { isTrustedOrigin, protectStateChangingRequests } from "./modules/auth/request-protection";
import { requireDatabase, requireOrganization } from "./modules/auth/tenant.middleware";
import { AuthSession } from "./modules/auth/auth-session.model";

// Load .env file first
dotenv.config();

// Validate environment variables at startup
const config = validateEnv();
const PORT = config.PORT || "5000";

const app = express();
const startTime = Date.now();

// 1. Security & Standard Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser clients may omit Origin; browser origins must match exactly.
      if (!origin) return callback(null, true);
      return callback(null, isTrustedOrigin(origin));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-FI360-Request"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));
app.use(protectStateChangingRequests);

app.get("/api/live", (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: "live",
    service: "fi360-backend",
    version: "1.0.0",
    environment: config.NODE_ENV,
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const databaseReady = isDbConnected();
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "not_ready",
    service: "fi360-backend",
    version: "1.0.0",
    environment: config.NODE_ENV,
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
    database: databaseReady ? "connected" : "unavailable",
    modules: {
      auth: databaseReady ? "active" : "unavailable",
      vehicles: databaseReady ? "active" : "unavailable",
      drivers: databaseReady ? "active" : "unavailable",
      maintenance: databaseReady ? "active" : "unavailable",
      organizations: databaseReady ? "active" : "unavailable",
      ai: config.GEMINI_API_KEY && databaseReady ? "active" : "standby",
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
      "/api/live",
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/me",
      "/api/users",
      "/api/organizations",
      "/api/vehicles",
      "/api/drivers",
      "/api/maintenance",
    ],
  });
});

// 3. Public Auth Routes
app.use("/api/auth", authRoutes);

// 4. Protected Subsystems (Require Authenticated Bearer Token or Session Cookie)
app.use("/api/users", userRoutes);
app.use("/api/organizations", authenticate, requireDatabase, requireOrganization, organizationRoutes);
app.use("/api/vehicles", authenticate, requireDatabase, requireOrganization, vehicleRoutes);
app.use("/api/drivers", authenticate, requireDatabase, requireOrganization, driverRoutes);
app.use("/api/maintenance", authenticate, requireDatabase, requireOrganization, maintenanceRoutes);
app.use("/api/ai", authenticate, requireDatabase, requireOrganization, aiRoutes);
app.use("/api/tyres", authenticate, requireDatabase, requireOrganization, tyreRoutes);
app.use("/api/fuel", authenticate, requireDatabase, requireOrganization, fuelRoutes);
app.use("/api/inspections", authenticate, requireDatabase, requireOrganization, inspectionRoutes);
app.use("/api/transport", authenticate, requireDatabase, requireOrganization, transportRoutes);

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

async function startServer(): Promise<void> {
  await connectDB();
  if (isDbConnected()) {
    await AuthSession.createIndexes();
  }
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 FI360 Backend running on port ${PORT}`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
    console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
    console.log(`📦 DB: ${isDbConnected() ? "✅ MongoDB connected" : "⚠️ Database unavailable"}\n`);
  });

  // Graceful shutdown on Render restart / SIGTERM
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  });
}

if (require.main === module) {
  void startServer().catch((error: unknown) => {
    console.error(
      "Backend startup failed:",
      error instanceof Error ? error.message : "Unknown startup error."
    );
    process.exitCode = 1;
  });
}

export default app;
