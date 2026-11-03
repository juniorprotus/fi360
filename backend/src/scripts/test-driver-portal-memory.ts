import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";

const HOST = "127.0.0.1";
const DATABASE_NAME = "fi360_driver_portal_test";
const MONGODB_VERSION = "7.0.14";

async function run(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Driver portal memory tests cannot run in production.");
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
    const connectionString = mongo.getUri(DATABASE_NAME);
    const parsed = new URL(connectionString);
    if (
      parsed.protocol !== "mongodb:" ||
      parsed.hostname !== HOST ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== `/${DATABASE_NAME}` ||
      parsed.search
    ) {
      throw new Error("Driver portal tests require the expected isolated loopback MongoDB URI.");
    }

    const result = await new Promise<number>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        ["--import", "tsx", "src/scripts/test-driver-portal.ts"],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            NODE_ENV: "test",
            MONGODB_URI: connectionString,
            JWT_SECRET: "fi360-driver-portal-isolated-test-secret",
            FRONTEND_URL: "http://localhost:3000",
          },
          stdio: "inherit",
          windowsHide: true,
        }
      );
      child.once("error", reject);
      child.once("close", (code) => resolve(code ?? 1));
    });
    if (result !== 0) throw new Error(`Driver portal integration suite exited with code ${result}.`);
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

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Driver portal memory tests failed.");
  process.exitCode = 1;
});
