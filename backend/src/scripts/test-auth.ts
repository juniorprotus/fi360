/**
 * Automated Authentication & Security Test Suite
 * ===============================================
 * Validates backend authentication, session verification, RBAC,
 * protected routes, and failure states against the live Express app.
 *
 * Usage:
 *   npm run test:auth
 */

import http from "http";
import app from "../server";
import { AuthService } from "../modules/auth/auth.service";
import { isDbConnected } from "../config/db";

let server: http.Server;
let baseUrl: string;

function request(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const postData = body ? JSON.stringify(body) : "";

    const reqHeaders: Record<string, string> = {
      ...headers,
    };
    if (body) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {}
          resolve({
            status: res.statusCode || 500,
            body: parsed,
            headers: res.headers,
          });
        });
      }
    );

    req.on("error", reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failed++;
  }
}

function parseCookieHeader(setCookieHeader: string | string[] | undefined): string {
  if (!setCookieHeader) return "";
  const values = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

  for (const value of values) {
    const match = value.match(/fi360_token=([^;]*)/i);
    if (match) {
      return `fi360_token=${match[1]}`;
    }
  }

  return "";
}

async function runTests() {
  console.log("\n🧪 ── FI360 Production Security & Auth Test Suite ──\n");

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 5001;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const testEmail = `test.operator.${Date.now()}@acmelogistics.com`;
  const testPassword = "SecurePassphrase123!";
  let cookieHeader = "";

  try {
    console.log("▶ Test 1: Rejecting arbitrary unregistered credentials");
    const t1 = await request("POST", "/api/auth/login", {
      email: "random.nonexistent.user@xyz.org",
      password: "someRandomPassword123",
    });
    assert(
      t1.status === 401 && t1.body.success === false,
      "Random credentials return 401 Unauthorized",
      `Got status ${t1.status}`
    );

    console.log("\n▶ Test 2: Protected API endpoints enforce authentication");
    const t2 = await request("GET", "/api/vehicles");
    assert(
      t2.status === 401 && t2.body.success === false,
      "GET /api/vehicles without cookie or token returns 401",
      `Got status ${t2.status}`
    );

    console.log("\n▶ Test 3: Forged or invalid cookie tokens are rejected");
    const t3 = await request("GET", "/api/vehicles", null, {
      Cookie: "fi360_token=not-a-real-token",
    });
    assert(
      t3.status === 401,
      "Forged cookie returns 401",
      `Got status ${t3.status}`
    );

    const unknownUserToken = AuthService.generateToken({
      userId: "000000000000000000000000",
      email: "unknown@example.test",
      name: "Unknown User",
      role: "owner",
    });
    const unknownUserSession = await request("GET", "/api/auth/me", null, {
      Authorization: `Bearer ${unknownUserToken}`,
    });
    assert(
      unknownUserSession.status === (isDbConnected() ? 401 : 503),
      "Missing user and unavailable database return distinct responses",
      `Got status ${unknownUserSession.status}`
    );

    console.log("\n▶ Test 4: Genuine registration creates organization and sets HttpOnly cookie");
    const t4 = await request("POST", "/api/auth/register", {
      email: testEmail,
      password: testPassword,
      name: "Acme Fleet Director",
      organizationName: "Acme Global Freight Ltd",
    });
    const registrationCookie = parseCookieHeader(t4.headers["set-cookie"]);
    assert(
      t4.status === 201 &&
        t4.body.success === true &&
        !!registrationCookie &&
        !Object.prototype.hasOwnProperty.call(t4.body, "token"),
      "Registration returns 201 and sets a cookie without exposing JWT in JSON",
      `Got status ${t4.status} and cookie ${registrationCookie ? "set" : "missing"}`
    );
    cookieHeader = registrationCookie || cookieHeader;

    console.log("\n▶ Test 5: Wrong password for existing account is rejected");
    const t5 = await request("POST", "/api/auth/login", {
      email: testEmail,
      password: "WrongPasswordAttempt!",
    });
    assert(
      t5.status === 401 && t5.body.success === false,
      "Incorrect password returns 401",
      `Got status ${t5.status}`
    );

    console.log("\n▶ Test 6: Legitimate login succeeds and returns cookie-only session data");
    const t6 = await request("POST", "/api/auth/login", {
      email: testEmail,
      password: testPassword,
    });
    const loginCookie = parseCookieHeader(t6.headers["set-cookie"]);
    assert(
      t6.status === 200 &&
        t6.body.success === true &&
        t6.body.user.email === testEmail &&
        t6.body.user.role === "owner" &&
        !!loginCookie &&
        !Object.prototype.hasOwnProperty.call(t6.body, "token"),
      "Login returns 200 OK with cookie-backed session and no JWT in JSON",
      `Got status ${t6.status} and cookie ${loginCookie ? "set" : "missing"}`
    );
    cookieHeader = loginCookie || cookieHeader;

    console.log("\n▶ Test 7: Session verification (/api/auth/me) with valid cookie");
    const t7 = await request("GET", "/api/auth/me", null, {
      Cookie: cookieHeader,
    });
    assert(
      t7.status === 200 &&
        t7.body.success === true &&
        t7.body.user.email === testEmail,
      "Session verification returns current user profile from cookie",
      `Got status ${t7.status}`
    );

    console.log("\n▶ Test 8: Accessing protected endpoints with valid cookie succeeds");
    const t8 = await request("GET", "/api/vehicles", null, {
      Cookie: cookieHeader,
    });
    assert(
      t8.status === 200 && t8.body.success === true,
      "GET /api/vehicles with valid cookie returns 200",
      `Got status ${t8.status}`
    );

    console.log("\n▶ Test 9: Public health check remains operational and unauthenticated");
    const t9 = await request("GET", "/api/health");
    assert(
      t9.status === 200 && t9.body.status === "ok",
      "/api/health responds with 200 OK without credentials",
      `Got status ${t9.status}`
    );

    console.log("\n▶ Test 10: Logout endpoint clears the session cookie");
    const t10 = await request("POST", "/api/auth/logout", null, {
      Cookie: cookieHeader,
    });
    const clearedCookie = parseCookieHeader(t10.headers["set-cookie"]);
    assert(
      t10.status === 200 &&
        t10.body.success === true &&
        !!clearedCookie &&
        clearedCookie.startsWith("fi360_token="),
      "POST /api/auth/logout responds with 200 and clears fi360_token cookie",
      `Got status ${t10.status} and cookie ${clearedCookie || "missing"}`
    );
    cookieHeader = "";

    console.log("\n▶ Test 11: Cleared cookies are rejected for authenticated routes");
    const t11 = await request("GET", "/api/auth/me", null, {
      Cookie: cookieHeader,
    });
    assert(
      t11.status === 401,
      "Cleared cookie is rejected by /api/auth/me",
      `Got status ${t11.status}`
    );
  } finally {
    server.close();
  }

  console.log(`\n📊 ── Results: ${passed} passed, ${failed} failed ──\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("✨ All security & authentication checks passed successfully!\n");
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  if (server) server.close();
  process.exit(1);
});
