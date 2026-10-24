import { z } from "zod";

const DEFAULT_DEV_JWT_SECRET = "fi360_secure_jwt_secret_dev_key_2026";
const INSECURE_JWT_SECRETS = new Set([
  "fi360_secure_jwt_secret_dev_key_2026",
  "changeme",
  "secret",
  "dev-secret",
  "jwt-secret",
]);

/**
 * Environment Variable Validation Schema
 * Validates required settings and fails closed in production before the service starts.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/).default("5000"),
  MONGODB_URI: z.string().trim().min(1).optional(),
  FRONTEND_URL: z.string().url().optional().default("http://localhost:3000"),
  GEMINI_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters").default(DEFAULT_DEV_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

export function validateEnv(): Env {
  if (env) return env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const summary = Object.entries(errors)
      .map(([key, msgs]) => `- ${key}: ${msgs?.join(", ")}`)
      .join("\n");

    if (process.env.NODE_ENV === "production") {
      throw new Error(`Production environment validation failed:\n${summary}`);
    }

    console.error("❌ Invalid environment configuration:");
    console.error(summary);
    console.warn("⚠️  FI360 running in degraded mode. Some features may be unavailable.");
    env = {
      NODE_ENV: process.env.NODE_ENV === "production" ? "production" : "development",
      PORT: process.env.PORT || "5000",
      MONGODB_URI: process.env.MONGODB_URI || undefined,
      FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
      JWT_SECRET: process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    };
    return env;
  }

  env = result.data;

  if (env.NODE_ENV === "production") {
    if (!env.MONGODB_URI || env.MONGODB_URI.trim() === "") {
      throw new Error("Production startup refused: MONGODB_URI is required and must not be empty.");
    }
    if (INSECURE_JWT_SECRETS.has(env.JWT_SECRET)) {
      throw new Error("Production startup refused: JWT_SECRET must not use the insecure default value.");
    }
  }

  if (!env.MONGODB_URI) {
    console.warn(
      "⚠️  MONGODB_URI not set — running in offline fallback mode (in-memory data). Set this in Render environment variables to enable persistence."
    );
  }
  if (!env.GEMINI_API_KEY) {
    console.warn("⚠️  GEMINI_API_KEY not set — AI telematics will use heuristic fallback.");
  }

  return env;
}

export function getEnv(): Env {
  if (!env) validateEnv();
  return env;
}
