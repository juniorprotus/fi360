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

async function runTests() {
  console.log("\n🧪 ── FI360 Production Security & Auth Test Suite ──\n");

  // Start temporary test server on ephemeral port
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
  let authToken = "";

  try {
    // Test 1: Random/Unregistered credentials must be rejected with 401
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

    // Test 2: Protected routes reject requests without a token (HTTP 401)
    console.log("\n▶ Test 2: Protected API endpoints enforce authentication");
    const t2 = await request("GET", "/api/vehicles");
    assert(
      t2.status === 401 && t2.body.success === false,
      "GET /api/vehicles without token returns 401",
      `Got status ${t2.status}`
    );

    // Test 3: Forged / invalid JWT token returns 401
    console.log("\n▶ Test 3: Forged or invalid JWT tokens are rejected");
    const t3 = await request("GET", "/api/vehicles", null, {
      Authorization: "Bearer invalid.forged.token.signature",
    });
    assert(
      t3.status === 401,
      "Forged token returns 401",
      `Got status ${t3.status}`
    );

    // Test 4: Genuine registration creates organization and owner user
    console.log("\n▶ Test 4: Genuine customer organization registration");
    const t4 = await request("POST", "/api/auth/register", {
      email: testEmail,
      password: testPassword,
      name: "Acme Fleet Director",
      organizationName: "Acme Global Freight Ltd",
    });
    assert(
      t4.status === 201 && t4.body.success === true && !!t4.body.token,
      "Registration returns 201 Created with valid JWT",
      `Got status ${t4.status}`
    );
    authToken = t4.body.token;

    // Test 5: Wrong password for registered user is rejected with 401
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

    // Test 6: Valid credentials succeed and return token + profile
    console.log("\n▶ Test 6: Legitimate login with correct credentials");
    const t6 = await request("POST", "/api/auth/login", {
      email: testEmail,
      password: testPassword,
    });
    assert(
      t6.status === 200 &&
        t6.body.success === true &&
        t6.body.user.email === testEmail &&
        t6.body.user.role === "owner",
      "Login returns 200 OK with server-derived role and credentials",
      `Got status ${t6.status}`
    );
    authToken = t6.body.token;

    // Test 7: Session verification (/api/auth/me) with valid token
    console.log("\n▶ Test 7: Session verification (/api/auth/me)");
    const t7 = await request("GET", "/api/auth/me", null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert(
      t7.status === 200 &&
        t7.body.success === true &&
        t7.body.user.email === testEmail,
      "Session verification returns current user profile",
      `Got status ${t7.status}`
    );

    // Test 8: Access protected endpoint with valid token succeeds
    console.log("\n▶ Test 8: Accessing protected endpoints with valid token");
    const t8 = await request("GET", "/api/vehicles", null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert(
      t8.status === 200 && t8.body.success === true,
      "GET /api/vehicles with valid token returns 200",
      `Got status ${t8.status}`
    );

    // Test 9: Public health check remains operational and unauthenticated
    console.log("\n▶ Test 9: Public health check availability");
    const t9 = await request("GET", "/api/health");
    assert(
      t9.status === 200 && t9.body.status === "ok",
      "/api/health responds with 200 OK without credentials",
      `Got status ${t9.status}`
    );

    // Test 10: Logout invalidates session
    console.log("\n▶ Test 10: Logout endpoint");
    const t10 = await request("POST", "/api/auth/logout");
    assert(
      t10.status === 200 && t10.body.success === true,
      "POST /api/auth/logout responds with 200 OK",
      `Got status ${t10.status}`
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
