import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";

const HOST = "127.0.0.1";
const DATABASE_NAME = "fi360_security_test";
const MONGODB_VERSION = "7.0.14";

function runSecurityTests(uri: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "src/scripts/test-security.ts"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "test",
          MONGODB_URI: uri,
          FRONTEND_URL: "http://localhost:3000",
        },
        stdio: "inherit",
        windowsHide: true,
      }
    );
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Security test process failed (${signal || code || "unknown"}).`));
    });
  });
}

async function runTests(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("In-memory security tests cannot run with NODE_ENV=production.");
  }
  const previousDownloadDirectory = process.env.MONGOMS_DOWNLOAD_DIR;
  const previousSystemBinary = process.env.MONGOMS_SYSTEM_BINARY;
  let mongo: MongoMemoryServer | undefined;
  delete process.env.MONGOMS_DOWNLOAD_DIR;
  delete process.env.MONGOMS_SYSTEM_BINARY;

  try {
    mongo = await MongoMemoryServer.create({
      binary: { version: MONGODB_VERSION },
      instance: { dbName: DATABASE_NAME, ip: HOST },
    });
    const uri = mongo.getUri(DATABASE_NAME);
    const parsed = new URL(uri);
    if (
      parsed.protocol !== "mongodb:" ||
      parsed.hostname !== HOST ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== `/${DATABASE_NAME}` ||
      parsed.search
    ) {
      throw new Error("Temporary MongoDB URI failed isolated-loopback validation.");
    }
    await runSecurityTests(uri);
  } finally {
    try {
      await mongo?.stop();
    } finally {
      if (previousDownloadDirectory === undefined) delete process.env.MONGOMS_DOWNLOAD_DIR;
      else process.env.MONGOMS_DOWNLOAD_DIR = previousDownloadDirectory;
      if (previousSystemBinary === undefined) delete process.env.MONGOMS_SYSTEM_BINARY;
      else process.env.MONGOMS_SYSTEM_BINARY = previousSystemBinary;
    }
  }
}

runTests().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? `Isolated MongoDB security test runner failed: ${error.message}`
      : "Isolated MongoDB security test runner failed."
  );
  process.exitCode = 1;
});
