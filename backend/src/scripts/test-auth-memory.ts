import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const HOST = "127.0.0.1";
const DATABASE_NAME = "fi360_auth_test";
const MONGODB_VERSION = "7.0.14";
const STARTUP_TIMEOUT_MS = 60_000;

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, HOST, () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Could not allocate a local backend test port."));
        return;
      }
      const { port } = address;
      probe.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function runProcess(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  label: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${label} failed${
            signal ? ` after signal ${signal}` : ` with exit code ${code ?? "unknown"}`
          }.`
        )
      );
    });
  });
}

async function waitForProductionHealth(
  child: ChildProcess,
  port: number
): Promise<void> {
  const healthUrl = `http://${HOST}:${port}/api/health`;
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let lastError = "health endpoint did not become ready";

  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error("Compiled production backend exited before passing its health check.");
    }

    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1500) });
      const body: unknown = await response.json();
      if (
        response.ok &&
        typeof body === "object" &&
        body !== null &&
        "database" in body &&
        body.database === "connected"
      ) {
        console.log("PASS: compiled production server started with MongoDB connected and health returned 200.");
        return;
      }
      lastError = `health returned HTTP ${response.status} without a connected database`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "health request failed";
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Compiled production backend health check timed out: ${lastError}.`);
}

async function stopChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;

  const closed = new Promise<void>((resolve) => child.once("close", () => resolve()));
  child.kill("SIGTERM");
  const exited = await Promise.race([
    closed.then(() => true),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 10_000)),
  ]);

  if (!exited) {
    child.kill("SIGKILL");
    await closed;
  }
}

function validateGeneratedUri(connectionString: string): void {
  const parsed = new URL(connectionString);
  const queryKeys = [...parsed.searchParams.keys()];
  if (
    parsed.protocol !== "mongodb:" ||
    parsed.hostname !== HOST ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.pathname !== `/${DATABASE_NAME}` ||
    queryKeys.some((key) => key !== "replicaSet") ||
    !parsed.searchParams.has("replicaSet")
  ) {
    throw new Error("Temporary MongoDB did not provide the expected isolated local database URI.");
  }
}

async function runTests(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("In-memory authentication tests cannot run with NODE_ENV=production.");
  }

  const previousDownloadDirectory = process.env.MONGOMS_DOWNLOAD_DIR;
  const previousSystemBinary = process.env.MONGOMS_SYSTEM_BINARY;
  let mongo: MongoMemoryReplSet | undefined;
  let productionServer: ChildProcess | undefined;

  delete process.env.MONGOMS_DOWNLOAD_DIR;
  delete process.env.MONGOMS_SYSTEM_BINARY;

  try {
    mongo = await MongoMemoryReplSet.create({
      binary: { version: MONGODB_VERSION },
      replSet: { count: 1, storageEngine: "wiredTiger", ip: HOST },
    });

    const connectionString = mongo.getUri(DATABASE_NAME);
    validateGeneratedUri(connectionString);

    const compiledEntry = join(process.cwd(), "dist", "server.js");
    await access(compiledEntry);
    const productionPort = await getAvailablePort();
    const testSecret = "fi360-task7-isolated-production-test-secret";
    const commonTestEnv: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "production",
      MONGODB_URI: connectionString,
      JWT_SECRET: testSecret,
      JWT_EXPIRES_IN: "15m",
      FRONTEND_URL: "https://fi360-auth-test.example",
      PORT: String(productionPort),
    };
    delete commonTestEnv.FI360_REQUIRE_DATABASE;
    delete commonTestEnv.FI360_TEST_MONGODB_URI;

    productionServer = spawn(process.execPath, [compiledEntry], {
      cwd: process.cwd(),
      env: commonTestEnv,
      stdio: "inherit",
      windowsHide: true,
    });

    await waitForProductionHealth(productionServer, productionPort);
    await stopChild(productionServer);
    productionServer = undefined;

    await runProcess(
      process.execPath,
      ["--import", "tsx", "src/scripts/test-auth.ts"],
      {
        ...commonTestEnv,
        PORT: "0",
        FI360_REQUIRE_DATABASE: "1",
      },
      "MongoDB-backed authentication regression suite"
    );
  } finally {
    if (productionServer) await stopChild(productionServer);
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
    }
  }
}

runTests().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "MongoDB-backed authentication tests failed."
  );
  process.exitCode = 1;
});
