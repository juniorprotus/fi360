import crypto from "node:crypto";
import http from "node:http";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDB, disconnectDB } from "../config/db";

const HOST = "127.0.0.1";
const DATABASE_NAME = "fi360_auth_transaction_failure_test";
const MONGODB_VERSION = "7.0.14";
const TEST_SECRET = "fi360-standalone-transaction-test-secret";

async function runTests(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Transaction-failure tests cannot run with NODE_ENV=production.");
  }

  const previousEnv = {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL,
  };
  const previousDownloadDirectory = process.env.MONGOMS_DOWNLOAD_DIR;
  const previousSystemBinary = process.env.MONGOMS_SYSTEM_BINARY;
  let mongo: MongoMemoryServer | undefined;
  let server: http.Server | undefined;

  delete process.env.MONGOMS_DOWNLOAD_DIR;
  delete process.env.MONGOMS_SYSTEM_BINARY;

  try {
    mongo = await MongoMemoryServer.create({
      binary: { version: MONGODB_VERSION },
      instance: { dbName: DATABASE_NAME, ip: HOST },
    });
    const connectionString = mongo.getUri(DATABASE_NAME);
    const parsedUri = new URL(connectionString);
    if (
      parsedUri.protocol !== "mongodb:" ||
      parsedUri.hostname !== HOST ||
      parsedUri.username !== "" ||
      parsedUri.password !== "" ||
      parsedUri.pathname !== `/${DATABASE_NAME}`
    ) {
      throw new Error("Temporary MongoDB did not provide the expected isolated loopback URI.");
    }

    process.env.NODE_ENV = "test";
    process.env.MONGODB_URI = connectionString;
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.FRONTEND_URL = "http://localhost:3000";

    const [{ default: app }, { AuthService }, { AuthSession }, { User }] = await Promise.all([
      import("../server"),
      import("../modules/auth/auth.service"),
      import("../modules/auth/auth-session.model"),
      import("../modules/auth/user.model"),
    ]);
    await connectDB();

    const password = "InitialPassword123!";
    const user = await User.create({
      email: `standalone-reset-${Date.now()}@example.test`,
      password,
      name: "Standalone Transaction Test",
      role: "owner",
      status: "active",
    });
    const token = await AuthService.issueToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });
    const tokenClaims = AuthService.verifyToken(token);
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 60_000);
    await user.save();

    server = await new Promise<http.Server>((resolve, reject) => {
      const listener = app.listen(0, HOST, () => resolve(listener));
      listener.once("error", reject);
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Standalone transaction test server did not bind to loopback.");
    }

    const response = await fetch(`http://${HOST}:${address.port}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        "X-FI360-Request": "1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: resetToken, newPassword: "ChangedPassword456!" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status !== 503) {
      throw new Error(`Unsupported transaction topology should return HTTP 503, received ${response.status}.`);
    }
    console.log("PASS: password reset fails closed with HTTP 503 on standalone MongoDB.");

    const savedUser = await User.findById(user._id)
      .select("+password +passwordResetToken +passwordResetExpires");
    const savedSession = await AuthSession.findOne({ jti: tokenClaims.jti });
    if (
      !savedUser ||
      !savedUser.passwordResetToken ||
      !(await savedUser.comparePassword(password)) ||
      (await savedUser.comparePassword("ChangedPassword456!")) ||
      !savedSession ||
      savedSession.revokedAt
    ) {
      throw new Error("Unsupported transaction topology partially changed reset or session state.");
    }
    console.log("PASS: unsupported transaction leaves password, reset token, and active session unchanged.");

    const sessionCheck = await fetch(`http://${HOST}:${address.port}/api/auth/me`, {
      headers: { Cookie: `fi360_token=${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (sessionCheck.status !== 200) {
      throw new Error(`Existing session should remain valid after aborted reset; received HTTP ${sessionCheck.status}.`);
    }
    console.log("PASS: failed reset preserves the existing authenticated session.");
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await disconnectDB();
    await mongo?.stop();
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (previousDownloadDirectory === undefined) {
      delete process.env.MONGOMS_DOWNLOAD_DIR;
    } else {
      process.env.MONGOMS_DOWNLOAD_DIR = previousDownloadDirectory;
    }
    if (previousSystemBinary === undefined) {
      delete process.env.MONGOMS_SYSTEM_BINARY;
    } else {
      process.env.MONGOMS_SYSTEM_BINARY = previousSystemBinary;
    }
  }
}

runTests().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Transaction-failure tests did not complete."
  );
  process.exitCode = 1;
});
