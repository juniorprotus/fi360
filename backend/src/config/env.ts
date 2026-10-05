import { z } from "zod";

/**
 * Environment Variable Validation Schema
 * Validates all required environment variables at startup before any module loads.
 * This prevents subtle runtime failures in production (Render free tier).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/).default("5000"),
  MONGODB_URI: z.string().optional(), // Optional to allow offline fallback mode
  FRONTEND_URL: z.string().url().optional().default("http://localhost:3000"),
  GEMINI_API_KEY: z.string().optional(), // Optional: AI features degrade gracefully if missing
});

type Env = z.infer<typeof envSchema>;

let env: Env;

export function validateEnv(): Env {
  if (env) return env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error("❌ Invalid environment configuration:");
    Object.entries(errors).forEach(([key, msgs]) => {
      console.error(`  - ${key}: ${msgs?.join(", ")}`);
    });
    // Don't crash: degraded mode with warnings
    console.warn("⚠️  FI360 running in degraded mode. Some features may be unavailable.");
    env = result.error.issues.reduce((acc, _) => acc, {} as Env);
  } else {
    env = result.data;

    if (!env.MONGODB_URI) {
      console.warn(
        "⚠️  MONGODB_URI not set — running in offline fallback mode (in-memory data). Set this in Render environment variables to enable persistence."
      );
    }
    if (!env.GEMINI_API_KEY) {
      console.warn("⚠️  GEMINI_API_KEY not set — AI telematics will use heuristic fallback.");
    }
  }

  return env;
}

export function getEnv(): Env {
  if (!env) validateEnv();
  return env;
}
