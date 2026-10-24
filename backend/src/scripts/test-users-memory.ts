import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

const HOST = "127.0.0.1";
const DATABASE_NAME = "fi360_user_management_test";
const MONGODB_VERSION = "7.0.14";

function runUserManagementTests(connectionString: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "src/scripts/test-users.ts"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "test",
          FI360_TEST_MONGODB_URI: connectionString,
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

      reject(
        new Error(
          `User-management tests exited unsuccessfully${
            signal ? ` after signal ${signal}` : ` with code ${code ?? "unknown"}`
          }.`
        )
      );
    });
  });
}

async function runTests(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("In-memory user-management tests cannot run in production.");
  }

  const downloadDirectory = await mkdtemp(join(tmpdir(), "fi360-user-test-mongo-"));
  const previousDownloadDirectory = process.env.MONGOMS_DOWNLOAD_DIR;
  const previousSystemBinary = process.env.MONGOMS_SYSTEM_BINARY;
  let mongo: MongoMemoryServer | undefined;

  process.env.MONGOMS_DOWNLOAD_DIR = downloadDirectory;
  delete process.env.MONGOMS_SYSTEM_BINARY;

  try {
    mongo = await MongoMemoryServer.create({
      binary: {
        downloadDir: downloadDirectory,
        version: MONGODB_VERSION,
      },
      instance: {
        dbName: DATABASE_NAME,
        ip: HOST,
      },
    });

    const connectionString = mongo.getUri(DATABASE_NAME);
    const parsedUri = new URL(connectionString);
    if (
      parsedUri.protocol !== "mongodb:" ||
      parsedUri.hostname !== HOST ||
      parsedUri.pathname !== `/${DATABASE_NAME}`
    ) {
      throw new Error("In-memory MongoDB did not provide the expected isolated test URI.");
    }

    await runUserManagementTests(connectionString);
  } finally {
    try {
      await mongo?.stop();
    } finally {
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

      await rm(downloadDirectory, { force: true, recursive: true });
    }
  }
}

runTests().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "In-memory user-management tests failed."
  );
  process.exitCode = 1;
});
