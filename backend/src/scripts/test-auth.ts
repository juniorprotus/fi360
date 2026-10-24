import assert from "node:assert/strict";
import http from "node:http";
import app from "../server";
import { AuthService } from "../modules/auth/auth.service";
import { User } from "../modules/auth/user.model";
import { Organization } from "../modules/organization/organization.model";
import { isDbConnected, connectDB, disconnectDB } from "../config/db";

let server: http.Server | undefined;
let baseUrl: string;
let passed = 0;
let failed = 0;

interface TestResponse {
  status: number;
  body: Record<string, any>;
  headers: http.IncomingHttpHeaders;
}

function request(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<TestResponse> {
  return new Promise((resolve, reject) => {
    const postData = body === undefined ? "" : JSON.stringify(body);
    const reqHeaders: Record<string, string> = { ...headers };
    if (body !== undefined) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      new URL(path, baseUrl),
      { method, headers: reqHeaders },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => (raw += chunk));
        res.on("end", () => {
          let parsed: Record<string, any> = {};
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { raw };
          }
          resolve({
            status: res.statusCode ?? 500,
            body: parsed,
            headers: res.headers,
          });
        });
      }
    );

    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function check(condition: boolean, name: string, detail?: string): void {
  if (condition) {
    console.log(`PASS: ${name}`);
    passed++;
  } else {
    console.error(`FAIL: ${name}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

function cookieFromHeader(header: string | string[] | undefined): string {
  const values = header ? (Array.isArray(header) ? header : [header]) : [];
  for (const value of values) {
    const match = value.match(/fi360_token=([^;]*)/i);
    if (match) return `fi360_token=${match[1]}`;
  }
  return "";
}

function cookieHasProductionAttributes(header: string | string[] | undefined): boolean {
  const values = header ? (Array.isArray(header) ? header : [header]) : [];
  const cookie = values.find((value) => /^fi360_token=/i.test(value));
  return Boolean(
    cookie &&
      /;\s*HttpOnly/i.test(cookie) &&
      /;\s*Secure/i.test(cookie) &&
      /;\s*SameSite=None/i.test(cookie) &&
      /;\s*Path=\//i.test(cookie)
  );
}

async function runTests(): Promise<void> {
  if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI) {
    throw new Error("Production authentication tests require an isolated MongoDB URI.");
  }

  await connectDB();
  if (process.env.FI360_REQUIRE_DATABASE === "1" && !isDbConnected()) {
    throw new Error("Database-backed authentication was required but MongoDB is unavailable.");
  }

  console.log(
    `\nFI360 authentication regression suite (${isDbConnected() ? "MongoDB-backed" : "offline fallback"})\n`
  );

  try {
    server = await new Promise<http.Server>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Authentication test server did not bind to a TCP port.");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;

    const email = `auth-test-${Date.now()}@example.test`;
    const password = "SecurePassphrase123!";
    let sessionCookie = "";

    const invalid = await request("POST", "/api/auth/login", {
      email: "missing-user@example.test",
      password: "WrongPassword123!",
    });
    check(invalid.status === 401 && invalid.body.success === false, "nonexistent user is rejected safely");

    const noSession = await request("GET", "/api/vehicles");
    check(noSession.status === 401, "protected API rejects requests without a session");

    const forged = await request("GET", "/api/vehicles", undefined, {
      Cookie: "fi360_token=not-a-real-token",
    });
    check(forged.status === 401, "forged cookie is rejected");

    const unknownToken = AuthService.generateToken({
      userId: "000000000000000000000000",
      email: "unknown@example.test",
      name: "Unknown User",
      role: "owner",
    });
    const unknownSession = await request("GET", "/api/auth/me", undefined, {
      Authorization: `Bearer ${unknownToken}`,
    });
    check(
      unknownSession.status === (isDbConnected() ? 401 : 503),
      "token referencing no database user is rejected",
      `HTTP ${unknownSession.status}`
    );

    const registration = await request("POST", "/api/auth/register", {
      email,
      password,
      name: "Authentication Test Owner",
      organizationName: "Authentication Test Organization",
    });
    const registrationCookie = cookieFromHeader(registration.headers["set-cookie"]);
    sessionCookie = registrationCookie;
    check(
      registration.status === 201 &&
        registration.body.success === true &&
        !!registrationCookie &&
        !("token" in registration.body),
      "registration creates a session without exposing a JWT in JSON",
      `HTTP ${registration.status}`
    );
    if (process.env.NODE_ENV === "production") {
      check(
        cookieHasProductionAttributes(registration.headers["set-cookie"]),
        "registration cookie is HttpOnly, Secure, SameSite=None, and path-scoped"
      );
    }

    const wrongPassword = await request("POST", "/api/auth/login", {
      email,
      password: "IncorrectPassword123!",
    });
    check(
      wrongPassword.status === 401 && wrongPassword.body.success === false,
      "incorrect password is rejected"
    );

    const login = await request("POST", "/api/auth/login", { email, password });
    const loginCookie = cookieFromHeader(login.headers["set-cookie"]);
    if (loginCookie) sessionCookie = loginCookie;
    check(
      login.status === 200 &&
        login.body.success === true &&
        login.body.user?.email === email &&
        !!loginCookie &&
        !("token" in login.body),
      "valid credentials authenticate and return cookie-only session data",
      `HTTP ${login.status}`
    );
    if (process.env.NODE_ENV === "production") {
      check(
        cookieHasProductionAttributes(login.headers["set-cookie"]),
        "login cookie is HttpOnly, Secure, SameSite=None, and path-scoped"
      );
    }

    const currentSession = await request("GET", "/api/auth/me", undefined, {
      Cookie: sessionCookie,
    });
    check(
      currentSession.status === 200 &&
        currentSession.body.user?.email === email &&
        currentSession.body.user?.role === "owner",
      "session resolves the current database user"
    );

    const protectedRequest = await request("GET", "/api/vehicles", undefined, {
      Cookie: sessionCookie,
    });
    check(
      protectedRequest.status === 200 && protectedRequest.body.success === true,
      "valid cookie accesses protected fleet API"
    );

    const health = await request("GET", "/api/health");
    check(health.status === 200 && health.body.status === "ok", "health endpoint responds successfully");

    const logout = await request("POST", "/api/auth/logout", undefined, {
      Cookie: sessionCookie,
    });
    const clearCookie = cookieFromHeader(logout.headers["set-cookie"]);
    check(
      logout.status === 200 &&
        logout.body.success === true &&
        clearCookie === "fi360_token=",
      "logout clears the fi360_token cookie"
    );
    const clearedCookieRequest = await request("GET", "/api/auth/me", undefined, {
      Cookie: clearCookie,
    });
    check(clearedCookieRequest.status === 401, "cleared cookie is rejected");

    if (isDbConnected()) {
      const savedUser = await User.findOne({ email }).select("+password");
      check(
        !!savedUser &&
          savedUser.password !== password &&
          (await savedUser.comparePassword(password)),
        "database stores a password hash that verifies the submitted password"
      );
      check(
        !("password" in registration.body.user) &&
          !("password" in login.body.user) &&
          !("passwordResetToken" in login.body.user),
        "authentication responses exclude password and reset-token fields"
      );

      const organizationId = savedUser?.organizationId?.toString();
      const organization = organizationId
        ? await Organization.findById(organizationId)
        : null;
      check(
        !!organization &&
          organization.name === "Authentication Test Organization" &&
          registration.body.user?.organizationId === organization._id.toString() &&
          currentSession.body.user?.organizationId === organization._id.toString() &&
          currentSession.body.user?.organizationName === organization.name,
        "session resolves the registered organization and membership from MongoDB"
      );

      const owner = savedUser;
      if (!owner) throw new Error("Registered test user was not persisted.");
      owner.role = "viewer";
      await owner.save();
      const changedRoleRequest = await request("GET", "/api/users", undefined, {
        Cookie: sessionCookie,
      });
      check(
        changedRoleRequest.status === 403,
        "authorization observes a role change despite the previously issued token"
      );

      owner.role = "owner";
      owner.status = "suspended";
      await owner.save();
      const suspendedSession = await request("GET", "/api/auth/me", undefined, {
        Cookie: sessionCookie,
      });
      const suspendedLogin = await request("POST", "/api/auth/login", { email, password });
      check(
        suspendedSession.status === 401 && suspendedLogin.status === 401,
        "suspended users cannot use existing sessions or log in"
      );
      owner.status = "active";
      await owner.save();

      const deletedUser = await User.create({
        email: `deleted-auth-test-${Date.now()}@example.test`,
        password: "DeletedUserPassphrase123!",
        name: "Deleted Authentication Test User",
        role: "fleet_manager",
        organizationId: owner.organizationId,
        organizationName: owner.organizationName,
        status: "active",
      });
      const deletedLogin = await request("POST", "/api/auth/login", {
        email: deletedUser.email,
        password: "DeletedUserPassphrase123!",
      });
      const deletedCookie = cookieFromHeader(deletedLogin.headers["set-cookie"]);
      await User.deleteOne({ _id: deletedUser._id });
      const deletedSession = await request("GET", "/api/vehicles", undefined, {
        Cookie: deletedCookie,
      });
      check(
        deletedLogin.status === 200 && deletedSession.status === 401,
        "deleted users cannot continue using previously issued sessions"
      );

      await disconnectDB();
      const unavailableSession = await request("GET", "/api/auth/me", undefined, {
        Cookie: sessionCookie,
      });
      const unavailableLogin = await request("POST", "/api/auth/login", { email, password });
      const unavailableRegistration = await request("POST", "/api/auth/register", {
        email: `db-unavailable-${Date.now()}@example.test`,
        password,
        name: "Database Unavailable Test",
        organizationName: "Database Unavailable Test Organization",
      });
      check(
        unavailableSession.status === 503 &&
          unavailableLogin.status === 503 &&
          unavailableRegistration.status === 503,
        "production auth fails closed with HTTP 503 when database access is unavailable"
      );
    }
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await disconnectDB();
  }

  console.log(`\nAuthentication results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

runTests().catch(async (error: unknown) => {
  console.error(
    "Authentication test execution failed:",
    error instanceof Error ? error.message : "Unknown test error."
  );
  if (server) {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  }
  await disconnectDB();
  process.exitCode = 1;
});
