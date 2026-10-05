import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      "⚠️  MONGODB_URI is not defined. Database features will use in-memory fallback.\n" +
        "   → To enable persistence: set MONGODB_URI in your .env file or Render environment variables."
    );
    return;
  }

  if (isConnected) {
    return;
  }

  try {
    // Attach lifecycle listeners BEFORE connect() to capture all events
    mongoose.connection.on("connected", () => {
      isConnected = true;
      console.log("✅ MongoDB Atlas connected successfully.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.warn("⚠️  MongoDB disconnected. Mongoose will auto-retry on next operation...");
    });

    mongoose.connection.on("reconnected", () => {
      isConnected = true;
      console.log("🔄 MongoDB reconnected successfully.");
    });

    await mongoose.connect(uri, {
      // Recommended production settings for Render free tier
      serverSelectionTimeoutMS: 10000,  // 10s timeout (Atlas M0 can be slow to respond)
      socketTimeoutMS: 45000,           // Socket timeout
      maxPoolSize: 5,                   // M0 free tier max connections is low
      minPoolSize: 1,
      connectTimeoutMS: 10000,
      // Auto-index only in dev to avoid Atlas M0 write unit waste
      autoIndex: process.env.NODE_ENV !== "production",
      // Retryable writes supported by Atlas
      retryWrites: true,
      w: "majority",
    });
  } catch (error) {
    console.error(
      "❌ Initial MongoDB connection failed:",
      error instanceof Error ? error.message : error
    );
    // Non-fatal: server starts anyway on offline fallback mode.
    // The /api/health endpoint continues responding for Render's uptime ping.
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("🔌 MongoDB disconnected (graceful shutdown).");
  }
}
