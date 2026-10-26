import crypto from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { User } from "../modules/auth/user.model";

const HOST = "127.0.0.1";
const DATABASE_NAME = "fi360_auth_multi_instance_test";
const MONGODB_VERSION = "7.0.14";
const STARTUP_TIMEOUT_MS = 60_000;
const FRONTEND_URL = "https://fi360-multi-instance-test.example";
const JWT_SECRET = "fi360-multi-instance-test-secret-not-for-production";

interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
  headers: Headers;
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, HOST, () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Could not allocate a loopback backend test port."));
        return;
      }
      const { port } = address;
      probe.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
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
    throw new Error("Temporary MongoDB did not provide the expected isolated loopback URI.");
  }
}

function startBackend(port: number, env: NodeJS.ProcessEnv): ChildProcess {
  const entry = join(process.cwd(), "dist", "server.js");
  return spawn(process.execPath, [entry], {
    cwd: process.cwd(),
    env: { ...env, PORT: String(port) },
    stdio: "inherit",
    windowsHide: true,
  });
}

async function waitForBackend(child: ChildProcess, port: number, label: string): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  const url = `http://${HOST}:${port}/api/health`;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`${label} exited before becoming ready.`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      const body = (await response.json()) as Record<string, unknown>;
      if (response.status === 200 && body.database === "connected") return;
    } catch {
      // Keep waiting while the local process starts.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${label} did not become ready against the isolated database.`);
}

async function stopBackend(child: ChildProcess | undefined): Promise<void> {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
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

async function api(
  port: number,
  path: string,
  options: { method?: string; body?: unknown; cookie?: string } = {}
): Promise<ApiResponse> {
  const response = await fetch(`http://${HOST}:${port}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Origin: FRONTEND_URL,
      "X-FI360-Request": "1",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(20_000),
  });
  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  return { status: response.status, body, headers: response.headers };
}

function cookieFrom(response: ApiResponse): string {
  const value = response.headers.get("set-cookie") ?? "";
  const match = value.match(/(?:^|,\s*)fi360_token=([^;,\s]+)/i);
  if (!match) throw new Error("Expected an authentication cookie from the local backend.");
  return `fi360_token=${match[1]}`;
}

function verify(status: number, expected: number, description: string): void {
  if (status !== expected) {
    throw new Error(`${description}: expected HTTP ${expected}, received HTTP ${status}.`);
  }
  console.log(`PASS: ${description}`);
}

async function runTests(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Multi-instance tests cannot run with NODE_ENV=production.");
  }

  const previousDownloadDirectory = process.env.MONGOMS_DOWNLOAD_DIR;
  const previousSystemBinary = process.env.MONGOMS_SYSTEM_BINARY;
  let mongo: MongoMemoryReplSet | undefined;
  let instanceA: ChildProcess | undefined;
  let instanceB: ChildProcess | undefined;
  let databaseStopped = false;

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

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "production",
      MONGODB_URI: connectionString,
      JWT_SECRET,
      JWT_EXPIRES_IN: "15m",
      FRONTEND_URL,
    };
    delete env.FI360_REQUIRE_DATABASE;
    delete env.FI360_TEST_MONGODB_URI;
    delete env.FI360_TEST_SESSION_COOKIE;

    await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 10_000 });
    const portA = await getAvailablePort();
    let portB = await getAvailablePort();
    while (portB === portA) portB = await getAvailablePort();
    instanceA = startBackend(portA, env);
    instanceB = startBackend(portB, env);
    await Promise.all([
      waitForBackend(instanceA, portA, "Instance A"),
      waitForBackend(instanceB, portB, "Instance B"),
    ]);
    console.log("PASS: two independent compiled backend processes are running concurrently.");

    const firstRegistration = await api(portA, "/api/auth/register", {
      method: "POST",
      body: {
        email: `multi-instance-a-${Date.now()}@example.test`,
        password: "InitialPassword123!",
        name: "Multi Instance Test A",
        organizationName: "Multi Instance Test Organization A",
      },
    });
    verify(firstRegistration.status, 201, "Instance A creates the account and issues a cookie session");
    const firstCookie = cookieFrom(firstRegistration);
    const firstEmail = (firstRegistration.body.user as { email: string }).email;
    const secondLogin = await api(portB, "/api/auth/login", {
      method: "POST",
      body: { email: firstEmail, password: "InitialPassword123!" },
    });
    verify(secondLogin.status, 200, "Instance B issues an independent session for the same account");
    const secondCookie = cookieFrom(secondLogin);
    verify(
      (await api(portA, "/api/auth/me", { cookie: secondCookie })).status,
      200,
      "Instance A accepts the session issued through Instance B"
    );

    verify(
      (await api(portA, "/api/auth/logout", { method: "POST", cookie: firstCookie })).status,
      200,
      "logout through Instance A revokes only its presented session"
    );
    verify(
      (await api(portB, "/api/auth/me", { cookie: firstCookie })).status,
      401,
      "Instance B rejects the session revoked through Instance A"
    );
    verify(
      (await api(portA, "/api/auth/me", { cookie: secondCookie })).status,
      200,
      "the account's independent session remains active before password reset"
    );

    const secondRegistration = await api(portB, "/api/auth/register", {
      method: "POST",
      body: {
        email: `multi-instance-b-${Date.now()}@example.test`,
        password: "OtherPassword123!",
        name: "Multi Instance Test B",
        organizationName: "Multi Instance Test Organization B",
      },
    });
    verify(secondRegistration.status, 201, "Instance B creates an independent second user's session");
    const otherUserCookie = cookieFrom(secondRegistration);

    const targetUser = await User.findOne({
      email: firstEmail,
    }).select("+passwordResetToken +passwordResetExpires");
    if (!targetUser) throw new Error("The isolated password-reset user was not persisted.");
    const resetToken = crypto.randomBytes(32).toString("hex");
    targetUser.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    targetUser.passwordResetExpires = new Date(Date.now() + 60_000);
    await targetUser.save();

    verify(
      (await api(portB, "/api/auth/reset-password", {
        method: "POST",
        body: { token: resetToken, newPassword: "ResetPassword456!" },
      })).status,
      200,
      "password reset through Instance B succeeds"
    );
    verify(
      (await api(portA, "/api/auth/me", { cookie: secondCookie })).status,
      401,
      "Instance A rejects the pre-reset session after reset through Instance B"
    );
    verify(
      (await api(portB, "/api/auth/me", { cookie: secondCookie })).status,
      401,
      "Instance B rejects the pre-reset session after reset"
    );
    verify(
      (await api(portA, "/api/auth/me", { cookie: otherUserCookie })).status,
      200,
      "password reset does not revoke another user's session on Instance A"
    );
    verify(
      (await api(portB, "/api/auth/me", { cookie: otherUserCookie })).status,
      200,
      "password reset does not revoke another user's session on Instance B"
    );
    verify(
      (await api(portA, "/api/auth/reset-password", {
        method: "POST",
        body: { token: resetToken, newPassword: "ThirdPassword789!" },
      })).status,
      400,
      "password reset token cannot be reused"
    );

    await mongo.stop();
    databaseStopped = true;
    const [failureA, failureB] = await Promise.all([
      api(portA, "/api/auth/me", { cookie: otherUserCookie }),
      api(portB, "/api/auth/me", { cookie: otherUserCookie }),
    ]);
    verify(failureA.status, 503, "Instance A fails closed when the shared session store is unavailable");
    verify(failureB.status, 503, "Instance B fails closed when the shared session store is unavailable");
  } finally {
    await Promise.all([stopBackend(instanceA), stopBackend(instanceB)]);
    await mongoose.disconnect();
    if (mongo && !databaseStopped) await mongo.stop();
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
    error instanceof Error ? error.message : "Multi-instance authentication tests failed."
  );
  process.exitCode = 1;
});
