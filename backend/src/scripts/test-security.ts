import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import app from "../server";
import { connectDB, disconnectDB, isDbConnected } from "../config/db";
import { AuthService } from "../modules/auth/auth.service";
import { User } from "../modules/auth/user.model";
import { Organization } from "../modules/organization/organization.model";
import { Vehicle } from "../modules/vehicle/vehicle.model";
import { Driver } from "../modules/drivers/driver.model";
import { MaintenanceLog } from "../modules/maintenance/maintenance.model";
import { Tyre } from "../modules/tyres/tyre.model";
import { FuelLog } from "../modules/fuel/fuel.model";
import { Inspection } from "../modules/inspections/inspection.model";
import { Trip } from "../modules/transport/trip.model";

const TRUSTED_ORIGIN = "http://localhost:3000";
let server: http.Server | undefined;
let baseUrl = "";
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
    const payload = body === undefined ? "" : JSON.stringify(body);
    const requestHeaders: Record<string, string> = {
      Origin: TRUSTED_ORIGIN,
      "X-FI360-Request": "1",
      ...headers,
    };
    if (body !== undefined) {
      requestHeaders["Content-Type"] = "application/json";
      requestHeaders["Content-Length"] = Buffer.byteLength(payload).toString();
    }
    const outgoing = http.request(
      new URL(path, baseUrl),
      { method, headers: requestHeaders },
      (incoming) => {
        let raw = "";
        incoming.setEncoding("utf8");
        incoming.on("data", (chunk: string) => (raw += chunk));
        incoming.on("end", () => {
          let parsed: Record<string, any>;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { raw };
          }
          resolve({
            status: incoming.statusCode ?? 500,
            body: parsed,
            headers: incoming.headers,
          });
        });
      }
    );
    outgoing.on("error", reject);
    if (payload) outgoing.write(payload);
    outgoing.end();
  });
}

function check(condition: boolean, name: string): void {
  try {
    assert.equal(condition, true);
    console.log(`PASS: ${name}`);
    passed++;
  } catch {
    console.error(`FAIL: ${name}`);
    failed++;
  }
}

async function sessionCookie(user: {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  role: "owner" | "viewer" | "driver" | "dispatcher";
  organizationId?: mongoose.Types.ObjectId;
}): Promise<string> {
  return `fi360_token=${await AuthService.issueToken({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId?.toString(),
  })}`;
}

async function runTests(): Promise<void> {
  if (!process.env.MONGODB_URI) {
    throw new Error("Security integration tests require an isolated MongoDB URI.");
  }
  await connectDB();
  if (!isDbConnected()) {
    throw new Error("Security integration tests require an active isolated MongoDB connection.");
  }

  try {
    server = await new Promise<http.Server>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Security test server failed to bind to loopback.");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const organizationA = await Organization.create({
      name: `Security Test A ${suffix}`,
      slug: `security-a-${suffix}`,
      plan: "pro",
    });
    const organizationB = await Organization.create({
      name: `Security Test B ${suffix}`,
      slug: `security-b-${suffix}`,
      plan: "pro",
    });
    const ownerA = await User.create({
      email: `owner-a-${suffix}@example.test`,
      password: "SecurityTestPassword123!",
      name: "Owner A",
      role: "owner",
      organizationId: organizationA._id,
      organizationName: organizationA.name,
      status: "active",
    });
    const ownerB = await User.create({
      email: `owner-b-${suffix}@example.test`,
      password: "SecurityTestPassword123!",
      name: "Owner B",
      role: "owner",
      organizationId: organizationB._id,
      organizationName: organizationB.name,
      status: "active",
    });
    const viewerA = await User.create({
      email: `viewer-a-${suffix}@example.test`,
      password: "SecurityTestPassword123!",
      name: "Viewer A",
      role: "viewer",
      organizationId: organizationA._id,
      organizationName: organizationA.name,
      status: "active",
    });
    const driverA = await User.create({
      email: `driver-a-${suffix}@example.test`,
      password: "SecurityTestPassword123!",
      name: "Driver A",
      role: "driver",
      organizationId: organizationA._id,
      organizationName: organizationA.name,
      status: "active",
    });
    const noTenantUser = await User.create({
      email: `no-tenant-${suffix}@example.test`,
      password: "SecurityTestPassword123!",
      name: "No Tenant",
      role: "owner",
      status: "active",
    });

    const vehicleA = await Vehicle.create({
      vin: `VIN-A-${suffix}`,
      plateNumber: `A${suffix.slice(-7)}`,
      make: "Test",
      model: "Vehicle A",
      year: 2025,
      type: "truck",
      organizationId: organizationA._id,
    });
    const vehicleB = await Vehicle.create({
      vin: `VIN-B-${suffix}`,
      plateNumber: `B${suffix.slice(-7)}`,
      make: "Test",
      model: "Vehicle B",
      year: 2025,
      type: "truck",
      organizationId: organizationB._id,
    });
    const driverRecordA = await Driver.create({
      fullName: "Fleet Driver A",
      licenseNumber: `DLA-${suffix}`,
      licenseExpiry: new Date("2030-01-01"),
      phone: "+254700000001",
      organizationId: organizationA._id,
      assignedVehicleId: vehicleA._id,
    });
    const driverRecordB = await Driver.create({
      fullName: "Fleet Driver B",
      licenseNumber: `DLB-${suffix}`,
      licenseExpiry: new Date("2030-01-01"),
      phone: "+254700000002",
      organizationId: organizationB._id,
      assignedVehicleId: vehicleB._id,
    });
    const maintenanceA = await MaintenanceLog.create({
      organizationId: organizationA._id,
      vehicleId: vehicleA._id,
      type: "inspection",
      description: "Tenant A test service",
      scheduledDate: new Date(),
    });
    const maintenanceB = await MaintenanceLog.create({
      organizationId: organizationB._id,
      vehicleId: vehicleB._id,
      type: "inspection",
      description: "Tenant B test service",
      scheduledDate: new Date(),
    });
    const tyreA = await Tyre.create({
      organizationId: organizationA._id,
      serialNumber: `TYA-${suffix}`,
      vehiclePlate: vehicleA.plateNumber,
      position: "Front left",
      brand: "Test tyre",
      treadDepthMm: 12,
      pressurePsi: 110,
    });
    const tyreB = await Tyre.create({
      organizationId: organizationB._id,
      serialNumber: `TYB-${suffix}`,
      vehiclePlate: vehicleB.plateNumber,
      position: "Front left",
      brand: "Test tyre",
      treadDepthMm: 12,
      pressurePsi: 110,
    });
    const fuelA = await FuelLog.create({
      organizationId: organizationA._id,
      receiptNumber: `FA-${suffix}`,
      vehiclePlate: vehicleA.plateNumber,
      litres: 50,
      costTotal: 100,
      odometerKm: 1000,
      station: "Test station",
      date: "2026-10-25 10:00",
    });
    const fuelB = await FuelLog.create({
      organizationId: organizationB._id,
      receiptNumber: `FB-${suffix}`,
      vehiclePlate: vehicleB.plateNumber,
      litres: 50,
      costTotal: 100,
      odometerKm: 1000,
      station: "Test station",
      date: "2026-10-25 10:00",
    });
    const inspectionA = await Inspection.create({
      organizationId: organizationA._id,
      reportNumber: `IA-${suffix}`,
      vehiclePlate: vehicleA.plateNumber,
      inspectorName: "Owner A",
      type: "Test",
      outcome: "passed",
      defectsSummary: "None",
      date: "2026-10-25 10:00",
    });
    const inspectionB = await Inspection.create({
      organizationId: organizationB._id,
      reportNumber: `IB-${suffix}`,
      vehiclePlate: vehicleB.plateNumber,
      inspectorName: "Owner B",
      type: "Test",
      outcome: "passed",
      defectsSummary: "None",
      date: "2026-10-25 10:00",
    });
    const tripA = await Trip.create({
      organizationId: organizationA._id,
      tripNumber: `TA-${suffix}`,
      vehiclePlate: vehicleA.plateNumber,
      assignedDriver: driverRecordA.fullName,
      origin: "A origin",
      destination: "A destination",
      cargoDescription: "Test cargo",
      eta: "Today",
      status: "dispatched",
    });
    const tripB = await Trip.create({
      organizationId: organizationB._id,
      tripNumber: `TB-${suffix}`,
      vehiclePlate: vehicleB.plateNumber,
      assignedDriver: driverRecordB.fullName,
      origin: "B origin",
      destination: "B destination",
      cargoDescription: "Test cargo",
      eta: "Today",
      status: "dispatched",
    });

    const cookieA = await sessionCookie(ownerA);
    const ownerHeaders = { Cookie: cookieA };

    const organizationList = await request("GET", "/api/organizations", undefined, ownerHeaders);
    check(
      organizationList.status === 200 &&
        organizationList.body.data.length === 1 &&
        organizationList.body.data[0]._id === organizationA._id.toString(),
      "organization listing returns only the caller's tenant"
    );
    check(
      (await request("GET", `/api/organizations/${organizationB._id}`, undefined, ownerHeaders)).status === 404 &&
        (await request("GET", `/api/organizations/slug/${organizationB.slug}`, undefined, ownerHeaders)).status === 404,
      "organization ID and slug lookups hide other tenants"
    );
    check(
      (await request("POST", "/api/organizations", { name: "Unapproved", slug: `bad-${suffix}` }, ownerHeaders)).status === 403,
      "organization creation is restricted to the registration workflow"
    );
    const protectedSettings = await request(
      "PATCH",
      `/api/organizations/${organizationA._id}`,
      { plan: "enterprise", enabledModules: ["ai"] },
      ownerHeaders
    );
    const ownOrgUpdate = await request(
      "PATCH",
      `/api/organizations/${organizationA._id}`,
      { name: "Renamed Tenant A" },
      ownerHeaders
    );
    check(protectedSettings.status === 400 && ownOrgUpdate.status === 200, "only allowlisted organization fields can be changed");
    check(
      (await request("PATCH", `/api/organizations/${organizationB._id}`, { name: "Stolen" }, ownerHeaders)).status === 404,
      "organization update cannot cross tenant boundary"
    );

    check(
      (await request("GET", `/api/vehicles/${vehicleB._id}`, undefined, ownerHeaders)).status === 404 &&
        (await request("PATCH", `/api/vehicles/${vehicleB._id}`, { status: "inactive" }, ownerHeaders)).status === 404 &&
        (await request("DELETE", `/api/vehicles/${vehicleB._id}`, undefined, ownerHeaders)).status === 404,
      "foreign vehicles cannot be read, modified, or deleted"
    );
    check(
      (await request("POST", "/api/vehicles", {
        vin: `VIN-ATTACK-${suffix.slice(-14)}`,
        plateNumber: `X${suffix.slice(-7)}`,
        make: "Test",
        model: "Injected",
        year: 2025,
        type: "truck",
        organizationId: organizationB._id.toString(),
      }, ownerHeaders)).status === 400 &&
        (await request("PATCH", `/api/vehicles/${vehicleA._id}`, {
          organizationId: organizationB._id.toString(),
        }, ownerHeaders)).status === 400,
      "vehicle creation and updates reject client-supplied ownership"
    );
    const createdVehicle = await request("POST", "/api/vehicles", {
      vin: `VIN-OWN-${suffix.slice(-16)}`,
      plateNumber: `C${suffix.slice(-7)}`,
      make: "Test",
      model: "Owned",
      year: 2025,
      type: "truck",
    }, ownerHeaders);
    check(createdVehicle.status === 201 && createdVehicle.body.data.organizationId === organizationA._id.toString(),
      "legitimate vehicle creation derives tenant from authenticated user");
    const vehicleList = await request("GET", "/api/vehicles", undefined, ownerHeaders);
    check(
      vehicleList.status === 200 &&
        vehicleList.body.data.some((record: { _id: string }) => record._id === vehicleA._id.toString()) &&
        !vehicleList.body.data.some((record: { _id: string }) => record._id === vehicleB._id.toString()),
      "vehicle listing returns only tenant records"
    );

    check(
      (await request("GET", `/api/drivers/${driverRecordB._id}`, undefined, ownerHeaders)).status === 404 &&
        (await request("PATCH", `/api/drivers/${driverRecordB._id}`, { status: "suspended" }, ownerHeaders)).status === 404,
      "foreign drivers cannot be read or modified"
    );
    const driverList = await request("GET", "/api/drivers", undefined, ownerHeaders);
    check(
      driverList.status === 200 &&
        driverList.body.data.some((record: { _id: string }) => record._id === driverRecordA._id.toString()) &&
        !driverList.body.data.some((record: { _id: string }) => record._id === driverRecordB._id.toString()),
      "driver listing returns only tenant records"
    );
    check(
      (await request("PATCH", `/api/drivers/${driverRecordA._id}`, {
        assignedVehicleId: vehicleB._id.toString(),
      }, ownerHeaders)).status === 400,
      "driver reassignment rejects a foreign-tenant vehicle"
    );
    check(
      (await request("POST", "/api/drivers", {
        fullName: "Foreign Vehicle Driver",
        licenseNumber: `DLX-${suffix}`,
        licenseExpiry: "2030-01-01",
        phone: "+254700000003",
        assignedVehicleId: vehicleB._id.toString(),
      }, ownerHeaders)).status === 400 &&
        (await request("POST", "/api/drivers", {
          fullName: "Injected Tenant Driver",
          licenseNumber: `DLY-${suffix}`,
          licenseExpiry: "2030-01-01",
          phone: "+254700000004",
          organizationId: organizationB._id.toString(),
        }, ownerHeaders)).status === 400,
      "driver creation rejects foreign vehicle references and ownership fields"
    );

    const maintenanceList = await request("GET", "/api/maintenance", undefined, ownerHeaders);
    check(
      maintenanceList.status === 200 &&
        maintenanceList.body.data.some((record: { _id: string }) => record._id === maintenanceA._id.toString()) &&
        !maintenanceList.body.data.some((record: { _id: string }) => record._id === maintenanceB._id.toString()),
      "maintenance listing returns only tenant records"
    );
    check(
      (await request("PATCH", `/api/maintenance/${maintenanceB._id}`, { status: "completed" }, ownerHeaders)).status === 404 &&
        (await request("PATCH", `/api/maintenance/${maintenanceA._id}`, {
          vehicleId: vehicleB._id.toString(),
        }, ownerHeaders)).status === 400 &&
        (await request("POST", "/api/maintenance", {
          vehicleId: vehicleB._id.toString(),
          type: "inspection",
          description: "Foreign vehicle work",
          scheduledDate: "2026-10-25",
        }, ownerHeaders)).status === 400,
      "maintenance writes cannot target foreign records or vehicles"
    );

    const tyreList = await request("GET", "/api/tyres", undefined, ownerHeaders);
    check(
      tyreList.status === 200 &&
        tyreList.body.data.some((record: { _id: string }) => record._id === tyreA._id.toString()) &&
        !tyreList.body.data.some((record: { _id: string }) => record._id === tyreB._id.toString()) &&
        (await request("PATCH", `/api/tyres/${tyreB._id}`, { status: "warning" }, ownerHeaders)).status === 404 &&
        (await request("DELETE", `/api/tyres/${tyreB._id}`, undefined, ownerHeaders)).status === 404,
      "tyre listing and mutations are tenant-scoped"
    );
    check(
      (await request("POST", "/api/tyres", {
        serialNumber: `TYX-${suffix}`,
        vehiclePlate: vehicleB.plateNumber,
        position: "Front",
        brand: "Test",
        treadDepthMm: 10,
        pressurePsi: 100,
      }, ownerHeaders)).status === 400 &&
        (await request("PATCH", `/api/tyres/${tyreA._id}`, {
          organizationId: organizationB._id.toString(),
        }, ownerHeaders)).status === 400,
      "tyre creation rejects foreign plates and raw ownership updates"
    );
    check(
        (await request("PATCH", `/api/tyres/${tyreA._id}`, {
          vehiclePlate: vehicleB.plateNumber,
        }, ownerHeaders)).status === 400,
        "tyre reassignment rejects a foreign-tenant vehicle"
    );

    const fuelList = await request("GET", "/api/fuel", undefined, ownerHeaders);
    check(
      fuelList.status === 200 &&
        fuelList.body.data.some((record: { _id: string }) => record._id === fuelA._id.toString()) &&
        !fuelList.body.data.some((record: { _id: string }) => record._id === fuelB._id.toString()) &&
        (await request("DELETE", `/api/fuel/${fuelB._id}`, undefined, ownerHeaders)).status === 404,
      "fuel listing and deletion are tenant-scoped"
    );
    check(
      (await request("POST", "/api/fuel", {
        receiptNumber: `F-X-${suffix}`,
        vehiclePlate: vehicleB.plateNumber,
        litres: 50,
        costTotal: 100,
        station: "Test",
      }, ownerHeaders)).status === 400 &&
        (await request("POST", "/api/fuel", {
          receiptNumber: `F-Y-${suffix}`,
          vehiclePlate: vehicleA.plateNumber,
          litres: 50,
          costTotal: 100,
          station: "Test",
          organizationId: organizationB._id.toString(),
        }, ownerHeaders)).status === 400,
      "fuel creation rejects foreign vehicles and ownership fields"
    );

    const inspectionList = await request("GET", "/api/inspections", undefined, ownerHeaders);
    check(
      inspectionList.status === 200 &&
        inspectionList.body.data.some((record: { _id: string }) => record._id === inspectionA._id.toString()) &&
        !inspectionList.body.data.some((record: { _id: string }) => record._id === inspectionB._id.toString()),
      "inspection listing is tenant-scoped"
    );
    const forgedInspection = await request("POST", "/api/inspections", {
      vehiclePlate: vehicleA.plateNumber,
      inspectorName: "Pretend Inspector",
      type: "Safety Audit",
      outcome: "passed",
      defectsSummary: "Passed",
    }, ownerHeaders);
    check(
      forgedInspection.status === 201 && forgedInspection.body.data.inspectorName === ownerA.name,
      "inspection identity is taken from the authenticated account, not request data"
    );
    check(
      (await request("POST", "/api/inspections", {
        vehiclePlate: vehicleB.plateNumber,
        inspectorName: ownerA.name,
      }, ownerHeaders)).status === 400 &&
        (await request("POST", "/api/inspections", {
          vehiclePlate: vehicleA.plateNumber,
          organizationId: organizationB._id.toString(),
        }, ownerHeaders)).status === 400,
      "inspection creation rejects foreign vehicles and ownership fields"
    );
    check(
      (await request("POST", "/api/inspections", {
        vehiclePlate: vehicleA.plateNumber,
      }, { Cookie: await sessionCookie(driverA) })).status === 403,
      "driver role cannot forge general inspection submissions"
    );

    const tripList = await request("GET", "/api/transport", undefined, ownerHeaders);
    check(
      tripList.status === 200 &&
        tripList.body.data.some((record: { _id: string }) => record._id === tripA._id.toString()) &&
        !tripList.body.data.some((record: { _id: string }) => record._id === tripB._id.toString()) &&
        (await request("PATCH", `/api/transport/${tripB._id}`, { status: "delayed" }, ownerHeaders)).status === 404,
      "trip listing and updates are tenant-scoped"
    );
    check(
      (await request("POST", "/api/transport", {
        vehiclePlate: vehicleB.plateNumber,
        assignedDriver: driverRecordA.fullName,
        origin: "X",
        destination: "Y",
      }, ownerHeaders)).status === 400 &&
        (await request("PATCH", `/api/transport/${tripA._id}`, {
          assignedDriver: driverRecordB.fullName,
        }, ownerHeaders)).status === 400 &&
        (await request("PATCH", `/api/transport/${tripA._id}`, {
          organizationId: organizationB._id.toString(),
        }, ownerHeaders)).status === 400,
      "trip writes reject foreign references and ownership updates"
    );

    const viewerHeaders = { Cookie: await sessionCookie(viewerA) };
    check(
      (await request("POST", "/api/vehicles", {
        vin: `VIN-VIEW-${suffix.slice(-16)}`,
        plateNumber: `V${suffix.slice(-7)}`,
        make: "Test",
        model: "Denied",
        year: 2025,
        type: "truck",
      }, viewerHeaders)).status === 403,
      "viewer cannot mutate operational resources through direct API calls"
    );
    check(
      (await request("GET", "/api/vehicles", undefined, {
        Cookie: await sessionCookie(noTenantUser),
      })).status === 403,
      "authenticated users without tenant membership fail closed"
    );

    check(
      (await request("PATCH", `/api/vehicles/${vehicleA._id}`, { status: "inactive" }, {
        Cookie: cookieA,
        Origin: "https://attacker.vercel.app",
      })).status === 403 &&
        (await request("PATCH", `/api/vehicles/${vehicleA._id}`, { status: "inactive" }, {
          Cookie: cookieA,
          "X-FI360-Request": "",
        })).status === 403,
      "cookie mutations reject untrusted origins and missing CSRF proof"
    );
    const trustedMutation = await request("PATCH", `/api/vehicles/${vehicleA._id}`, {
      status: "inactive",
    }, ownerHeaders);
    check(trustedMutation.status === 200, "trusted-origin mutation with CSRF proof remains usable");
    const untrustedCors = await request("OPTIONS", "/api/vehicles", undefined, {
      Origin: "https://attacker.vercel.app",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,x-fi360-request",
    });
    check(!untrustedCors.headers["access-control-allow-origin"], "untrusted Vercel preview receives no credentialed CORS grant");

    const registration = await request("POST", "/api/auth/register", {
      email: `onboarding-${suffix}@example.test`,
      password: "OnboardingPassword123!",
      name: "Onboarding Owner",
      organizationName: `Onboarding Organization ${suffix}`,
    });
    check(
      registration.status === 201 &&
        !!registration.headers["set-cookie"] &&
        registration.body.user?.role === "owner",
      "self-service registration remains a supported organization-onboarding path"
    );

    await disconnectDB();
    const unavailableHealth = await request("GET", "/api/health");
    const liveHealth = await request("GET", "/api/live");
    const unavailableAuth = await request("GET", "/api/vehicles", undefined, ownerHeaders);
    const unavailablePasswordReset = await request("POST", "/api/auth/reset-password", {
      token: "database-outage-test",
      newPassword: "NewSecurePassword123!",
    });
    check(
      unavailableHealth.status === 503 &&
        unavailableHealth.body.database === "unavailable" &&
        liveHealth.status === 200 &&
        unavailableAuth.status === 503 &&
        unavailablePasswordReset.status === 503,
      "database outages fail readiness, auth and tenant APIs while liveness remains available"
    );
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await disconnectDB();
  }

  console.log(`\nSecurity integration results: ${passed} passed, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

runTests().catch(async (error: unknown) => {
  console.error("Security integration tests failed to execute.");
  if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
  await disconnectDB();
  process.exitCode = 1;
});
