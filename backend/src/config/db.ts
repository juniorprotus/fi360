import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn("⚠️  MONGODB_URI is not defined in environment variables. Database features will be in offline mode.");
    return;
  }

  if (isConnected) {
    console.log("ℹ️  MongoDB already connected.");
    return;
  }

  try {
    mongoose.connection.on("connected", () => {
      isConnected = true;
      console.log("✅ MongoDB connected successfully.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.warn("⚠️  MongoDB disconnected. Attempting reconnection...");
    });

    mongoose.connection.on("reconnected", () => {
      isConnected = true;
      console.log("🔄 MongoDB reconnected.");
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: process.env.NODE_ENV !== "production",
    });
  } catch (error) {
    console.error("❌ Initial MongoDB connection failed:", error instanceof Error ? error.message : error);
    // Do not crash server; allow Render /api/health to function even during transient DB outages
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
