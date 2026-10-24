import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import type { Types } from "mongoose";

interface TestResponse {
  status: number;
  body: any;
}

function getSafeTestDatabaseName(connectionString: string): string {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error("FI360_TEST_MONGODB_URI must be a valid MongoDB connection URI.");
  }

  if (parsed.protocol !== "mongodb:" || !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)) {
    throw new Error(
      "Refusing to run user-management tests: use a local, dedicated MongoDB test instance."
    );
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, "")).toLowerCase();
  if (
    !databaseName.includes("test") ||
    /(^|[_-])(prod|production|live)([_-]|$)/.test(databaseName)
  ) {
    throw new Error(
      "Refusing to run user-management tests: use a dedicated test database, not a production or live database."
    );
  }

  return databaseName;
}

async function runTests(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("User-management integration tests cannot run in production.");
  }

  const testUri = process.env.FI360_TEST_MONGODB_URI;
  if (!testUri) {
    throw new Error(
      "FI360_TEST_MONGODB_URI must point to a dedicated test database; no database records were changed."
    );
  }

  getSafeTestDatabaseName(testUri);

  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = testUri;

  const mongoose = (await import("mongoose")).default;
  const { Organization } = await import("../modules/organization/organization.model");
  const { User } = await import("../modules/auth/user.model");
  const { AuthService } = await import("../modules/auth/auth.service");
  const { authenticate } = await import("../modules/auth/auth.middleware");
  const { userRoutes } = await import("../modules/auth/user.routes");

  await mongoose.connect(testUri, { autoIndex: true });

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ownerAEmail = `owner-a-${suffix}@example.test`;
  const adminAEmail = `admin-a-${suffix}@example.test`;
  const managerAEmail = `manager-a-${suffix}@example.test`;
  const ownerBEmail = `owner-b-${suffix}@example.test`;
  const noOrgAdminEmail = `admin-no-org-${suffix}@example.test`;
  const employeeEmail = `employee-${suffix}@example.test`;
  const adminCreatedEmail = `admin-created-${suffix}@example.test`;
  const secondOwnerEmail = `second-owner-${suffix}@example.test`;
  const secondAdminEmail = `second-admin-${suffix}@example.test`;
  const employeePassword = "TestPassphrase-482!";
  const fixtureEmails = [
    ownerAEmail,
    adminAEmail,
    managerAEmail,
    ownerBEmail,
    noOrgAdminEmail,
    employeeEmail,
    adminCreatedEmail,
    secondOwnerEmail,
    secondAdminEmail,
    `unauth-${suffix}@example.test`,
    `unauthorized-${suffix}@example.test`,
    `owner-escalation-${suffix}@example.test`,
    `admin-escalation-${suffix}@example.test`,
    `spoof-${suffix}@example.test`,
    `long-password-${suffix}@example.test`,
    `invalid-role-${suffix}@example.test`,
  ];
  const organizationIds: Types.ObjectId[] = [];
  let server: http.Server | undefined;

  try {
  await User.init();
  const userIndexes = await User.collection.indexes();
  if (!userIndexes.some((index) => index.key.email === 1 && index.unique === true)) {
    throw new Error("Test database does not have the unique user email index.");
  }

  const orgA = await Organization.create({
    name: `User Route Test A ${suffix}`,
    slug: `user-route-test-a-${suffix}`,
    plan: "pro",
  });
  organizationIds.push(orgA._id);
  const orgB = await Organization.create({
    name: `User Route Test B ${suffix}`,
    slug: `user-route-test-b-${suffix}`,
    plan: "pro",
  });
  organizationIds.push(orgB._id);

  const ownerA = await User.create({
    email: ownerAEmail,
    password: "OwnerPassword-482!",
    name: "Organization A Owner",
    role: "owner",
    organizationId: orgA._id,
    organizationName: orgA.name,
    status: "active",
  });
  const adminA = await User.create({
    email: adminAEmail,
    password: "AdminPassword-482!",
    name: "Organization A Admin",
    role: "admin",
    organizationId: orgA._id,
    organizationName: orgA.name,
    status: "active",
  });
  const managerA = await User.create({
    email: managerAEmail,
    password: "ManagerPassword-482!",
    name: "Organization A Fleet Manager",
    role: "fleet_manager",
    organizationId: orgA._id,
    organizationName: orgA.name,
    status: "active",
  });
  const ownerB = await User.create({
    email: ownerBEmail,
    password: "OwnerPassword-482!",
    name: "Organization B Owner",
    role: "owner",
    organizationId: orgB._id,
    organizationName: orgB.name,
    status: "active",
  });
  const noOrgAdmin = await User.create({
    email: noOrgAdminEmail,
    password: "AdminPassword-482!",
    name: "Admin Without Organization",
    role: "admin",
    status: "active",
  });

  const app = express();
  app.use(express.json());
  app.use("/api/users", userRoutes);
  app.get("/protected-test", authenticate, (req, res) => {
    res.status(200).json({ success: true, userId: req.user?.userId, role: req.user?.role });
  });
  app.use(
    (error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("User-management test server error:", error.message);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  );

  const listeningServer = app.listen(0, "127.0.0.1");
  server = listeningServer;
  await new Promise<void>((resolve, reject) => {
    listeningServer.once("listening", resolve);
    listeningServer.once("error", reject);
  });
  const address = listeningServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to determine test server address.");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const tokenFor = (user: {
    _id: Types.ObjectId;
    email: string;
    name: string;
    role: "owner" | "admin" | "fleet_manager";
    organizationId?: Types.ObjectId;
    organizationName?: string;
  }) =>
    AuthService.generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId?.toString(),
      organizationName: user.organizationName,
    });

  const request = async (
    method: string,
    path: string,
    token?: string,
    body?: Record<string, unknown>
  ): Promise<TestResponse> => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };

  const ownerAToken = tokenFor(ownerA);
  const adminAToken = tokenFor(adminA);
  const managerAToken = tokenFor(managerA);
  const ownerBToken = tokenFor(ownerB);
  const noOrgAdminToken = tokenFor(noOrgAdmin);

  let passed = 0;
  const check = (name: string, assertion: () => void) => {
    assertion();
    passed++;
    console.log(`PASS ${passed}: ${name}`);
  };

    const created = await request("POST", "/api/users", ownerAToken, {
      name: "New Organization A Employee",
      email: `  ${employeeEmail.toUpperCase()}  `,
      password: employeePassword,
      role: "technician",
    });
    check("owner creates an employee in their organization", () => {
      assert.equal(created.status, 201);
      assert.equal(created.body.data.email, employeeEmail);
      assert.equal(created.body.data.organizationId, orgA._id.toString());
      assert.equal(created.body.data.role, "technician");
    });
    const employeeId = created.body.data.id as string;

    const adminCreated = await request("POST", "/api/users", adminAToken, {
      name: "Administrator Created Employee",
      email: adminCreatedEmail,
      password: employeePassword,
      role: "driver",
    });
    check("authorized administrator creates an employee in their organization", () => {
      assert.equal(adminCreated.status, 201);
      assert.equal(adminCreated.body.data.organizationId, orgA._id.toString());
      assert.equal(adminCreated.body.data.role, "driver");
    });

    const secondOwner = await request("POST", "/api/users", ownerAToken, {
      name: "Second Organization Owner",
      email: secondOwnerEmail,
      password: employeePassword,
      role: "owner",
    });
    check("owner may explicitly assign the owner role", () => {
      assert.equal(secondOwner.status, 201);
      assert.equal(secondOwner.body.data.role, "owner");
    });

    const secondAdmin = await request("POST", "/api/users", ownerAToken, {
      name: "Second Organization Administrator",
      email: secondAdminEmail,
      password: employeePassword,
      role: "admin",
    });
    check("owner may create an organization administrator", () => {
      assert.equal(secondAdmin.status, 201);
      assert.equal(secondAdmin.body.data.role, "admin");
    });

    const invalid = await request("POST", "/api/users", ownerAToken, {
      name: "Missing Email Employee",
      password: employeePassword,
      role: "technician",
    });
    check("invalid or missing required fields are rejected", () => {
      assert.equal(invalid.status, 400);
    });

    const invalidRole = await request("POST", "/api/users", ownerAToken, {
      name: "Invalid Role Employee",
      email: `invalid-role-${suffix}@example.test`,
      password: employeePassword,
      role: "superuser",
    });
    check("roles outside the canonical role set are rejected", () => {
      assert.equal(invalidRole.status, 400);
    });

    const oversizedPassword = await request("POST", "/api/users", ownerAToken, {
      name: "Oversized Password Employee",
      email: `long-password-${suffix}@example.test`,
      password: "a".repeat(73),
      role: "technician",
    });
    check("passwords beyond bcrypt's input limit are rejected", () => {
      assert.equal(oversizedPassword.status, 400);
    });

    const duplicate = await request("POST", "/api/users", ownerAToken, {
      name: "Duplicate Employee",
      email: employeeEmail.toUpperCase(),
      password: employeePassword,
      role: "technician",
    });
    check("duplicate normalized email is rejected", () => {
      assert.equal(duplicate.status, 409);
    });

    const unauthenticated = await request("POST", "/api/users", undefined, {
      name: "Unauthenticated Employee",
      email: `unauth-${suffix}@example.test`,
      password: employeePassword,
      role: "technician",
    });
    check("unauthenticated user creation is rejected", () => {
      assert.equal(unauthenticated.status, 401);
    });

    const unauthorized = await request("POST", "/api/users", managerAToken, {
      name: "Unauthorized Employee",
      email: `unauthorized-${suffix}@example.test`,
      password: employeePassword,
      role: "technician",
    });
    check("non-administrator user creation is rejected", () => {
      assert.equal(unauthorized.status, 403);
    });

    const ownerEscalation = await request("POST", "/api/users", adminAToken, {
      name: "Owner Escalation Attempt",
      email: `owner-escalation-${suffix}@example.test`,
      password: employeePassword,
      role: "owner",
    });
    const adminEscalation = await request("POST", "/api/users", adminAToken, {
      name: "Administrator Escalation Attempt",
      email: `admin-escalation-${suffix}@example.test`,
      password: employeePassword,
      role: "admin",
    });
    check("administrators cannot assign owner or administrator roles", () => {
      assert.equal(ownerEscalation.status, 403);
      assert.equal(adminEscalation.status, 403);
    });

    const spoofedOrganization = await request("POST", "/api/users", ownerAToken, {
      name: "Organization Spoof Attempt",
      email: `spoof-${suffix}@example.test`,
      password: employeePassword,
      role: "technician",
      organizationId: orgB._id.toString(),
    });
    check("client-supplied organization identity is rejected", () => {
      assert.equal(spoofedOrganization.status, 400);
    });

    const listedA = await request("GET", "/api/users", ownerAToken);
    const listedB = await request("GET", "/api/users", ownerBToken);
    check("member lists are restricted to each authenticated organization", () => {
      assert.equal(listedA.status, 200);
      assert.equal(listedB.status, 200);
      assert.ok(listedA.body.data.some((user: { id: string }) => user.id === employeeId));
      assert.ok(!listedB.body.data.some((user: { id: string }) => user.id === employeeId));
    });

    const managerList = await request("GET", "/api/users", managerAToken);
    check("fleet managers cannot view the organization user list", () => {
      assert.equal(managerList.status, 403);
    });

    const malformedStatusId = await request("PATCH", "/api/users/not-an-id/status", ownerAToken, {
      status: "suspended",
    });
    const malformedRoleId = await request("PATCH", "/api/users/not-an-id/role", ownerAToken, {
      role: "viewer",
    });
    check("malformed user IDs are rejected as invalid requests", () => {
      assert.equal(malformedStatusId.status, 400);
      assert.equal(malformedRoleId.status, 400);
    });

    const statusCrossOrg = await request(
      "PATCH",
      `/api/users/${ownerB._id.toString()}/status`,
      ownerAToken,
      { status: "suspended" }
    );
    const roleCrossOrg = await request(
      "PATCH",
      `/api/users/${ownerB._id.toString()}/role`,
      ownerAToken,
      { role: "viewer" }
    );
    check("cross-organization status and role changes are rejected", () => {
      assert.equal(statusCrossOrg.status, 404);
      assert.equal(roleCrossOrg.status, 404);
    });

    const passwordRecord = await User.findById(employeeId).select("+password");
    check("password is hashed and credentials are excluded from API responses", () => {
      assert.ok(passwordRecord?.password);
      assert.notEqual(passwordRecord?.password, employeePassword);
      assert.ok(passwordRecord?.password?.startsWith("$2"));
      assert.ok(!("password" in created.body.data));
      assert.ok(!("passwordResetToken" in created.body.data));
      assert.ok(!JSON.stringify(created.body).includes(employeePassword));
      assert.ok(!listedA.body.data.some((user: Record<string, unknown>) => "password" in user));
    });

    const employeeLogin = await AuthService.login(employeeEmail, employeePassword);
    check("new employee can log in using the existing authentication service", () => {
      assert.equal(employeeLogin.user.email, employeeEmail);
      assert.equal(employeeLogin.user.role, "technician");
      assert.equal(employeeLogin.user.organizationId, orgA._id.toString());
    });

    const changedRole = await request("PATCH", `/api/users/${employeeId}/role`, ownerAToken, {
      role: "compliance",
    });
    const roleEscalation = await request("PATCH", `/api/users/${employeeId}/role`, adminAToken, {
      role: "admin",
    });
    check("owner role management works and administrator privilege escalation is blocked", () => {
      assert.equal(changedRole.status, 200);
      assert.equal(changedRole.body.data.role, "compliance");
      assert.equal(roleEscalation.status, 403);
    });

    const refreshedRole = await request(
      "GET",
      "/protected-test",
      employeeLogin.token
    );
    check("role changes are reflected when the existing token is used again", () => {
      assert.equal(refreshedRole.status, 200);
      assert.equal(refreshedRole.body.role, "compliance");
    });

    const adminStatusEscalation = await request(
      "PATCH",
      `/api/users/${secondAdmin.body.data.id}/status`,
      adminAToken,
      { status: "suspended" }
    );
    const adminRoleEscalation = await request(
      "PATCH",
      `/api/users/${secondAdmin.body.data.id}/role`,
      adminAToken,
      { role: "viewer" }
    );
    check("admin cannot manage another administrator's status or role", () => {
      assert.equal(adminStatusEscalation.status, 403);
      assert.equal(adminRoleEscalation.status, 403);
    });

    const suspended = await request("PATCH", `/api/users/${employeeId}/status`, ownerAToken, {
      status: "suspended",
    });
    check("owner can suspend a member within the organization", () => {
      assert.equal(suspended.status, 200);
      assert.equal(suspended.body.data.status, "suspended");
    });

    let suspendedLoginRejected = false;
    try {
      await AuthService.login(employeeEmail, employeePassword);
    } catch {
      suspendedLoginRejected = true;
    }
    check("suspended employee cannot log in", () => {
      assert.equal(suspendedLoginRejected, true);
    });

    const suspendedSession = await request(
      "GET",
      "/protected-test",
      employeeLogin.token
    );
    check("suspension also rejects an already-issued authentication token", () => {
      assert.equal(suspendedSession.status, 401);
    });

    const reactivated = await request("PATCH", `/api/users/${employeeId}/status`, ownerAToken, {
      status: "active",
    });
    check("owner can reactivate a member within the organization", () => {
      assert.equal(reactivated.status, 200);
      assert.equal(reactivated.body.data.status, "active");
    });

    const ownerStatus = await request(
      "PATCH",
      `/api/users/${secondOwner.body.data.id}/status`,
      ownerAToken,
      { status: "suspended" }
    );
    const ownerRole = await request(
      "PATCH",
      `/api/users/${secondOwner.body.data.id}/role`,
      ownerAToken,
      { role: "viewer" }
    );
    check("owner accounts cannot be deactivated or demoted by these member routes", () => {
      assert.equal(ownerStatus.status, 403);
      assert.equal(ownerRole.status, 403);
    });

    const selfDeactivation = await request(
      "PATCH",
      `/api/users/${ownerA._id.toString()}/status`,
      ownerAToken,
      { status: "suspended" }
    );
    check("administrator cannot deactivate their own account", () => {
      assert.equal(selfDeactivation.status, 400);
    });

    const missingOrganization = await request("GET", "/api/users", noOrgAdminToken);
    check("missing organization membership fails closed", () => {
      assert.equal(missingOrganization.status, 403);
    });

    console.log(`User-management integration tests: ${passed} passed, 0 failed.`);
  } finally {
    try {
      if (server?.listening) {
        await new Promise<void>((resolve, reject) => {
          server?.close((error) => (error ? reject(error) : resolve()));
        });
      }
      await User.deleteMany({ email: { $in: fixtureEmails } });
      if (organizationIds.length > 0) {
        await Organization.deleteMany({ _id: { $in: organizationIds } });
      }
    } finally {
      await mongoose.disconnect();
    }
  }
}

runTests().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "User-management integration tests failed."
  );
  process.exitCode = 1;
});
