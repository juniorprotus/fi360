import assert from "node:assert/strict";
import http from "node:http";
import app from "../server";
import { connectDB, disconnectDB } from "../config/db";

async function run(): Promise<void> {
  const cookie = process.env.FI360_TEST_SESSION_COOKIE;
  if (!cookie || !/^fi360_token=[^;]+$/.test(cookie)) {
    throw new Error("A test session cookie is required.");
  }

  await connectDB();
  const server = await new Promise<http.Server>((resolve, reject) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    listener.once("error", reject);
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Replay test server failed to bind to loopback.");
    }
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/me`, {
      headers: { Cookie: cookie },
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 401);
    console.log("PASS: a previously revoked session is rejected in a fresh backend process.");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await disconnectDB();
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Session replay test failed.");
  process.exitCode = 1;
});
