import assert from "node:assert/strict";
import http from "node:http";
import app from "../server";
import { connectDB, disconnectDB } from "../config/db";
import { AuthService } from "../modules/auth/auth.service";
import { User } from "../modules/auth/user.model";
import { Driver } from "../modules/drivers/driver.model";
import { Vehicle } from "../modules/vehicle/vehicle.model";
import { Inspection } from "../modules/inspections/inspection.model";

const HOST = "127.0.0.1";
const FRONTEND_URL = "http://localhost:3000";
const PASSWORD = "DriverPortalTestPassword123!";

interface ResponseData {
  status: number;
  body: Record<string, any>;
}

async function request(
  baseUrl: string,
  method: string,
  path: string,
  cookie?: string,
  body?: unknown
): Promise<ResponseData> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Origin: FRONTEND_URL,
      "X-FI360-Request": "1",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  return { status: response.status, body: await response.json() as Record<string, any> };
}

function assertPass(condition: boolean, description: string): void {
  assert.ok(condition, description);
  console.log(`PASS: ${description}`);
}

async function createSession(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  role: "owner" | "admin" | "fleet_manager" | "driver" | "technician" | "viewer";
  organizationId?: { toString(): string };
  organizationName?: string;
}): Promise<string> {
  const token = await AuthService.issueToken({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId?.toString(),
    organizationName: user.organizationName,
  });
  return `fi360_token=${token}`;
}

async function run(): Promise<void> {
  let server: http.Server | undefined;
  const configuredUri = process.env.MONGODB_URI;
  if (!configuredUri) {
    throw new Error("Driver portal tests require an isolated loopback MongoDB URI.");
  }
  const parsedUri = new URL(configuredUri);
  if (
    parsedUri.protocol !== "mongodb:" ||
    parsedUri.hostname !== HOST ||
    parsedUri.username ||
    parsedUri.password ||
    parsedUri.pathname !== "/fi360_driver_portal_test" ||
    parsedUri.search
  ) {
    throw new Error("Driver portal tests require the expected isolated loopback MongoDB URI.");
  }
  await connectDB();

  try {
    const ownerRegistration = await AuthService.register({
      email: `portal-owner-${Date.now()}@example.test`,
      password: PASSWORD,
      name: "Portal Organization Owner",
      organizationName: "Driver Portal Test Organization",
    });
    const owner = await User.findById(ownerRegistration.user.userId);
    if (!owner || !owner.organizationId) throw new Error("Test owner organization was not created.");

    const driverAUser = await User.create({
      email: `portal-driver-a-${Date.now()}@example.test`,
      password: PASSWORD,
      name: "Driver A",
      role: "driver",
      organizationId: owner.organizationId,
      organizationName: owner.organizationName,
      status: "active",
    });
    const driverBUser = await User.create({
      email: `portal-driver-b-${Date.now()}@example.test`,
      password: PASSWORD,
      name: "Driver B",
      role: "driver",
      organizationId: owner.organizationId,
      organizationName: owner.organizationName,
      status: "active",
    });
    const fleetManager = await User.create({
      email: `portal-manager-${Date.now()}@example.test`,
      password: PASSWORD,
      name: "Portal Fleet Manager",
      role: "fleet_manager",
      organizationId: owner.organizationId,
      organizationName: owner.organizationName,
      status: "active",
    });
    const technician = await User.create({
      email: `portal-technician-${Date.now()}@example.test`,
      password: PASSWORD,
      name: "Portal Technician",
      role: "technician",
      organizationId: owner.organizationId,
      organizationName: owner.organizationName,
      status: "active",
    });
    const administrator = await User.create({
      email: `portal-admin-${Date.now()}@example.test`,
      password: PASSWORD,
      name: "Portal Administrator",
      role: "admin",
      organizationId: owner.organizationId,
      organizationName: owner.organizationName,
      status: "active",
    });
    const viewer = await User.create({
      email: `portal-viewer-${Date.now()}@example.test`,
      password: PASSWORD,
      name: "Portal Viewer",
      role: "viewer",
      organizationId: owner.organizationId,
      organizationName: owner.organizationName,
      status: "active",
    });
    const linkableDriverUser = await User.create({
      email: `portal-linkable-driver-${Date.now()}@example.test`,
      password: PASSWORD,
      name: "Linkable Driver",
      role: "driver",
      organizationId: owner.organizationId,
      organizationName: owner.organizationName,
      status: "active",
    });

    const vehicleA = await Vehicle.create({
      vin: "PORTALVIN000000001",
      plateNumber: `PORTALA${Date.now().toString().slice(-5)}`,
      make: "Volvo",
      model: "FH",
      year: 2022,
      type: "truck",
      status: "active",
      organizationId: owner.organizationId,
      telematicsData: { odometerKm: 48250 },
    });
    const vehicleB = await Vehicle.create({
      vin: "PORTALVIN000000002",
      plateNumber: `PORTALB${Date.now().toString().slice(-5)}`,
      make: "Mercedes-Benz",
      model: "Actros",
      year: 2021,
      type: "truck",
      status: "active",
      organizationId: owner.organizationId,
    });
    const driverA = await Driver.create({
      fullName: driverAUser.name,
      licenseNumber: `DL-PORTAL-A-${Date.now()}`,
      licenseClass: "Class A",
      licenseExpiry: "2027-12-31",
      phone: "+254700000001",
      status: "active",
      performanceScore: 90,
      assignedVehicleId: vehicleA._id,
      linkedUserId: driverAUser._id,
      organizationId: owner.organizationId,
    });
    const driverB = await Driver.create({
      fullName: driverBUser.name,
      licenseNumber: `DL-PORTAL-B-${Date.now()}`,
      licenseClass: "Class A",
      licenseExpiry: "2027-12-31",
      phone: "+254700000002",
      status: "active",
      performanceScore: 88,
      assignedVehicleId: vehicleB._id,
      linkedUserId: driverBUser._id,
      organizationId: owner.organizationId,
    });
    await Driver.create({
      fullName: "Unassigned Driver",
      licenseNumber: `DL-PORTAL-U-${Date.now()}`,
      licenseClass: "Class B",
      licenseExpiry: "2027-12-31",
      phone: "+254700000003",
      status: "active",
      performanceScore: 75,
      linkedUserId: (await User.create({
        email: `portal-unassigned-${Date.now()}@example.test`,
        password: PASSWORD,
        name: "Unassigned Driver",
        role: "driver",
        organizationId: owner.organizationId,
        organizationName: owner.organizationName,
        status: "active",
      }))._id,
      organizationId: owner.organizationId,
    });
    const linkableDriver = await Driver.create({
      fullName: linkableDriverUser.name,
      licenseNumber: `DL-PORTAL-L-${Date.now()}`,
      licenseClass: "Class B",
      licenseExpiry: "2027-12-31",
      phone: "+254700000004",
      status: "active",
      performanceScore: 80,
      organizationId: owner.organizationId,
    });

    const ownerCookie = `fi360_token=${ownerRegistration.token}`;
    const driverACookie = await createSession(driverAUser);
    const driverBCookie = await createSession(driverBUser);
    const managerCookie = await createSession(fleetManager);
    const technicianCookie = await createSession(technician);
    const administratorCookie = await createSession(administrator);
    const viewerCookie = await createSession(viewer);

    server = await new Promise<http.Server>((resolve, reject) => {
      const listener = app.listen(0, HOST, () => resolve(listener));
      listener.once("error", reject);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server failed to bind.");
    const baseUrl = `http://${HOST}:${address.port}`;

    const ownerPortal = await request(baseUrl, "GET", "/api/drivers/me", ownerCookie);
    const managerPortal = await request(baseUrl, "GET", "/api/drivers/me", managerCookie);
    const technicianPortal = await request(baseUrl, "GET", "/api/drivers/me", technicianCookie);
    const administratorPortal = await request(baseUrl, "GET", "/api/drivers/me", administratorCookie);
    const viewerPortal = await request(baseUrl, "GET", "/api/drivers/me", viewerCookie);
    const ownerInspection = await request(baseUrl, "POST", "/api/drivers/me/inspections", ownerCookie, {
      type: "Pre-Trip Walkaround",
      outcome: "passed",
    });
    assertPass(
      ownerPortal.status === 403 &&
        managerPortal.status === 403 &&
        technicianPortal.status === 403 &&
        administratorPortal.status === 403 &&
        viewerPortal.status === 403 &&
        ownerInspection.status === 403,
      "owners, administrators, fleet managers, technicians, and viewers cannot access driver portal endpoints"
    );

    const driverAResponse = await request(
      baseUrl,
      "GET",
      "/api/drivers/me?userId=" + encodeURIComponent(driverBUser._id.toString()) +
        "&vehicleId=" + encodeURIComponent(vehicleB._id.toString()),
      driverACookie
    );
    assertPass(
      driverAResponse.status === 200 &&
        driverAResponse.body.data.driver.fullName === driverA.fullName &&
        driverAResponse.body.data.vehicle.plateNumber === vehicleA.plateNumber &&
        !JSON.stringify(driverAResponse.body).includes(vehicleB.plateNumber),
      "driver receives only their database-linked driver record and assigned vehicle; supplied IDs are ignored"
    );

    const driverBResponse = await request(baseUrl, "GET", "/api/drivers/me", driverBCookie);
    assertPass(
      driverBResponse.status === 200 &&
        driverBResponse.body.data.vehicle.plateNumber === vehicleB.plateNumber &&
        !JSON.stringify(driverBResponse.body).includes(vehicleA.plateNumber),
      "a second driver sees only their own assigned vehicle"
    );

    const unassignedUser = await User.findOne({ name: "Unassigned Driver" });
    if (!unassignedUser) throw new Error("Unassigned driver test account was not created.");
    const unassignedCookie = await createSession(unassignedUser as typeof driverAUser);
    const unassignedResponse = await request(baseUrl, "GET", "/api/drivers/me", unassignedCookie);
    assertPass(
      unassignedResponse.status === 200 && unassignedResponse.body.data.vehicle === null,
      "driver without a vehicle assignment receives an explicit null vehicle"
    );

    const generalDriverList = await request(baseUrl, "GET", "/api/drivers", driverACookie);
    assertPass(generalDriverList.status === 403, "driver cannot enumerate the organization driver roster");

    const forgedInspection = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      driverACookie,
      {
        type: "Pre-Trip Walkaround",
        outcome: "passed",
        defectsSummary: "No defects found.",
        vehiclePlate: vehicleB.plateNumber,
        driverId: driverB._id.toString(),
      }
    );
    assertPass(
      forgedInspection.status === 400,
      "driver inspection endpoint rejects browser-supplied driver and vehicle identifiers"
    );

    const inspectionSubmission = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      driverACookie,
      {
        type: "Pre-Trip Walkaround",
        outcome: "passed",
        defectsSummary: "No defects found.",
      }
    );
    const persistedInspection = await Inspection.findOne({
      organizationId: owner.organizationId,
      inspectorName: driverAUser.name,
    }).sort({ createdAt: -1 });
    assertPass(
      inspectionSubmission.status === 201 &&
        persistedInspection?.vehiclePlate === vehicleA.plateNumber &&
        persistedInspection.inspectorName === driverAUser.name,
      "driver inspection is attributed to the authenticated user and server-selected vehicle"
    );

    const unassignedInspection = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      unassignedCookie,
      { type: "Pre-Trip Walkaround", outcome: "passed", defectsSummary: "Clear." }
    );
    assertPass(unassignedInspection.status === 409, "unassigned driver cannot submit a vehicle inspection");

    const ownerCreateLinkedDriver = await request(
      baseUrl,
      "POST",
      "/api/drivers",
      ownerCookie,
      {
        fullName: "Manager Linked Test Driver",
        licenseNumber: `DL-MANAGER-${Date.now()}`,
        licenseClass: "Class A",
        licenseExpiry: "2027-12-31",
        phone: "+254700000004",
        status: "active",
        performanceScore: 90,
        assignedVehicleId: vehicleA._id.toString(),
        linkedUserId: driverBUser._id.toString(),
      }
    );
    assertPass(
      ownerCreateLinkedDriver.status === 400,
      "manager cannot link an account already assigned to another driver record"
    );

    const otherOrganization = await AuthService.register({
      email: `portal-other-owner-${Date.now()}@example.test`,
      password: PASSWORD,
      name: "Other Organization Owner",
      organizationName: "Other Driver Portal Organization",
    });
    const foreignDriver = await User.create({
      email: `portal-foreign-driver-${Date.now()}@example.test`,
      password: PASSWORD,
      name: "Foreign Driver",
      role: "driver",
      organizationId: otherOrganization.user.organizationId,
      organizationName: otherOrganization.user.organizationName,
      status: "active",
    });
    const foreignLink = await request(baseUrl, "POST", "/api/drivers", ownerCookie, {
      fullName: "Cross Tenant Link Attempt",
      licenseNumber: `DL-CROSS-${Date.now()}`,
      licenseClass: "Class A",
      licenseExpiry: "2027-12-31",
      phone: "+254700000005",
      status: "active",
      performanceScore: 90,
      linkedUserId: foreignDriver._id.toString(),
    });
    assertPass(foreignLink.status === 400, "manager cannot link a driver account from another organization");

    const availableAccounts = await request(baseUrl, "GET", "/api/drivers/available-accounts", ownerCookie);
    const availableIds = availableAccounts.body.data.map((account: { id: string }) => account.id);
    assertPass(
      availableAccounts.status === 200 &&
        availableIds.includes(linkableDriverUser._id.toString()) &&
        !availableIds.includes(driverAUser._id.toString()) &&
        !availableIds.includes(foreignDriver._id.toString()),
      "account linking options include only active, unlinked driver accounts in the current organization"
    );

    const linkedDriverResponse = await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${linkableDriver._id.toString()}`,
      ownerCookie,
      {
        linkedUserId: linkableDriverUser._id.toString(),
        assignedVehicleId: vehicleB._id.toString(),
      }
    );
    const linkedDriverCookie = await createSession(linkableDriverUser);
    const linkedDriverPortal = await request(baseUrl, "GET", "/api/drivers/me", linkedDriverCookie);
    assertPass(
      linkedDriverResponse.status === 200 &&
        linkedDriverPortal.status === 200 &&
        linkedDriverPortal.body.data.vehicle.plateNumber === vehicleB.plateNumber,
      "manager can link an active organization driver account and assign a database vehicle"
    );

    const unlinkResponse = await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${linkableDriver._id.toString()}`,
      ownerCookie,
      { linkedUserId: null }
    );
    const unlinkedPortal = await request(baseUrl, "GET", "/api/drivers/me", linkedDriverCookie);
    assertPass(
      unlinkResponse.status === 200 &&
        unlinkedPortal.status === 404,
      "removing a driver account link immediately removes portal access"
    );
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => error ? reject(error) : resolve());
      });
    }
    await disconnectDB();
  }
}

run().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "Driver portal tests failed.");
  await disconnectDB();
  process.exitCode = 1;
});
