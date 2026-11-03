import assert from "node:assert/strict";
import http from "node:http";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import app from "../server";
import { connectDB, disconnectDB } from "../config/db";
import { AuthService } from "../modules/auth/auth.service";
import { User } from "../modules/auth/user.model";
import { Driver } from "../modules/drivers/driver.model";
import { Vehicle } from "../modules/vehicle/vehicle.model";
import { Inspection } from "../modules/inspections/inspection.model";
import { getChecklistForVehicle } from "../modules/inspections/inspection-checklist";
import { MaintenanceLog } from "../modules/maintenance/maintenance.model";
import { Trip } from "../modules/transport/trip.model";

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

    const checklistResponse = await request(baseUrl, "GET", "/api/drivers/me/inspections/checklist", driverACookie);
    const truckChecklist = getChecklistForVehicle("truck");
    const checklistItems = checklistResponse.body.data as Array<{ id: string; critical: boolean }>;
    const validSubmission = {
      type: "pre_trip",
      odometerKm: 48300,
      clientSubmissionId: randomUUID(),
      driverAttested: true,
      checklist: truckChecklist.map((item) => ({ itemId: item.id, result: "pass" })),
    };
    const incompleteSubmission = await request(baseUrl, "POST", "/api/drivers/me/inspections", driverACookie, {
      ...validSubmission,
      clientSubmissionId: randomUUID(),
      checklist: validSubmission.checklist.slice(1),
    });
    const undescribedFailure = await request(baseUrl, "POST", "/api/drivers/me/inspections", driverACookie, {
      ...validSubmission,
      clientSubmissionId: randomUUID(),
      checklist: validSubmission.checklist.map((answer) =>
        answer.itemId === "service-brakes" ? { ...answer, result: "fail" } : answer
      ),
    });
    const unattestedSubmission = await request(baseUrl, "POST", "/api/drivers/me/inspections", driverACookie, {
      ...validSubmission,
      clientSubmissionId: randomUUID(),
      driverAttested: false,
    });
    assertPass(
      checklistResponse.status === 200 &&
        checklistItems.length === truckChecklist.length &&
        incompleteSubmission.status === 400 &&
        undescribedFailure.status === 400 &&
        unattestedSubmission.status === 400,
      "server supplies the vehicle-specific checklist and rejects missing answers, undescribed failures, and missing driver attestation"
    );

    const inspectionSubmission = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      driverACookie,
      validSubmission
    );
    const persistedInspection = await Inspection.findOne({
      organizationId: owner.organizationId,
      clientSubmissionId: validSubmission.clientSubmissionId,
    });
    const replayedSubmission = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      driverACookie,
      validSubmission
    );
    const conflictingReplay = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      driverACookie,
      { ...validSubmission, odometerKm: validSubmission.odometerKm + 1 }
    );
    const driverAHistory = await request(baseUrl, "GET", "/api/drivers/me/inspections", driverACookie);
    const driverBHistory = await request(baseUrl, "GET", "/api/drivers/me/inspections", driverBCookie);
    const updatedOdometerVehicle = await Vehicle.findById(vehicleA._id).lean();
    const reassignmentBeforeReplay = await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${driverA._id.toString()}`,
      ownerCookie,
      { assignedVehicleId: vehicleB._id.toString() }
    );
    const replayAfterReassignment = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      driverACookie,
      validSubmission
    );
    const vehicleBAfterReplay = await Vehicle.findById(vehicleB._id).lean();
    await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${driverA._id.toString()}`,
      ownerCookie,
      { assignedVehicleId: vehicleA._id.toString() }
    );
    assertPass(
      inspectionSubmission.status === 201 &&
        replayedSubmission.status === 200 &&
        conflictingReplay.status === 409 &&
        inspectionSubmission.body.data._id === replayedSubmission.body.data._id &&
        persistedInspection?.vehicleId?.toString() === vehicleA._id.toString() &&
        persistedInspection?.driverId?.toString() === driverA._id.toString() &&
        persistedInspection?.inspectorName === driverAUser.name &&
        persistedInspection?.driverAttested === true &&
        persistedInspection?.attestedBy?.toString() === driverAUser._id.toString() &&
        persistedInspection?.checklist.length === truckChecklist.length &&
        driverAHistory.body.data.some((record: { _id: string }) => record._id === persistedInspection?._id.toString()) &&
        !driverBHistory.body.data.some((record: { _id: string }) => record._id === persistedInspection?._id.toString()) &&
        updatedOdometerVehicle?.telematicsData.odometerKm === 48300 &&
        reassignmentBeforeReplay.status === 200 &&
        replayAfterReassignment.status === 200 &&
        replayAfterReassignment.body.data.vehicleId === vehicleA._id.toString() &&
        vehicleBAfterReplay?.telematicsData.odometerKm === 0,
      "driver inspection is authenticated, idempotent, private, preserves odometer, and remains linked to its original vehicle after reassignment"
    );
    const managerInspectionList = await request(baseUrl, "GET", "/api/inspections", managerCookie);
    const reviewedPassInspection = await request(
      baseUrl,
      "POST",
      `/api/inspections/${persistedInspection?._id.toString()}/review`,
      managerCookie,
      { reviewedOutcome: "passed", safetyDecision: "available", notes: "No defects found.", defectUpdates: [] }
    );
    assertPass(
      managerInspectionList.status === 200 &&
        managerInspectionList.body.data.some((record: { _id: string }) => record._id === persistedInspection?._id.toString()) &&
        reviewedPassInspection.status === 200 &&
        reviewedPassInspection.body.data.reviewHistory.at(-1)?.reviewerName === fleetManager.name,
      "authorized managers can list real tenant reports and persist a pass review with actor and timestamp"
    );
    const concurrentSubmissionBody = {
      ...validSubmission,
      odometerKm: 48301,
      clientSubmissionId: randomUUID(),
    };
    const concurrentResponses = await Promise.all([
      request(baseUrl, "POST", "/api/drivers/me/inspections", driverACookie, concurrentSubmissionBody),
      request(baseUrl, "POST", "/api/drivers/me/inspections", driverACookie, concurrentSubmissionBody),
    ]);
    const concurrentReportCount = await Inspection.countDocuments({
      organizationId: owner.organizationId,
      clientSubmissionId: concurrentSubmissionBody.clientSubmissionId,
    });
    assertPass(
      concurrentResponses.every((response) => response.status === 200 || response.status === 201) &&
        concurrentResponses.filter((response) => response.status === 201).length === 1 &&
        concurrentResponses[0].body.data._id === concurrentResponses[1].body.data._id &&
        concurrentReportCount === 1,
      "concurrent retries with one idempotency key produce exactly one persisted report"
    );
    const minorSubmission = {
      ...validSubmission,
      odometerKm: 48305,
      clientSubmissionId: randomUUID(),
      checklist: truckChecklist.map((item) => item.id === "windshield"
        ? { itemId: item.id, result: "fail", description: "Small chip outside the driver's line of sight", severity: "minor" }
        : { itemId: item.id, result: "pass" }),
    };
    const minorReportResponse = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      driverACookie,
      minorSubmission
    );
    const blockedMinorDispatch = await request(baseUrl, "POST", "/api/transport", managerCookie, {
      vehiclePlate: vehicleA.plateNumber,
      assignedDriver: driverA.fullName,
      origin: "Nairobi",
      destination: "Mombasa",
    });
    const approveMinorOperation = await request(
      baseUrl,
      "POST",
      `/api/inspections/${minorReportResponse.body.data?._id}/review`,
      managerCookie,
      { reviewedOutcome: "passed_with_defects", safetyDecision: "available", defectUpdates: [] }
    );
    const replayMinorSubmission = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      driverACookie,
      minorSubmission
    );
    const vehicleAfterMinorReplay = await Vehicle.findById(vehicleA._id).lean();
    const permittedMinorDispatch = await request(baseUrl, "POST", "/api/transport", managerCookie, {
      vehiclePlate: vehicleA.plateNumber,
      assignedDriver: driverA.fullName,
      origin: "Nairobi",
      destination: "Mombasa",
    });
    assertPass(
      minorReportResponse.status === 201 &&
        minorReportResponse.body.data.outcome === "failed" &&
        blockedMinorDispatch.status === 409 &&
        approveMinorOperation.status === 200 &&
        approveMinorOperation.body.data.reviewedOutcome === "passed_with_defects" &&
        replayMinorSubmission.status === 200 &&
        vehicleAfterMinorReplay?.safetyState === "available" &&
        permittedMinorDispatch.status === 201,
      "minor defects restrict operation until review; an approved report replay does not reinstate stale restrictions"
    );

    const unassignedInspection = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      unassignedCookie,
      {
        type: "pre_trip",
        odometerKm: 0,
        clientSubmissionId: randomUUID(),
        driverAttested: true,
        checklist: truckChecklist.map((item) => ({ itemId: item.id, result: "pass" })),
      }
    );
    assertPass(unassignedInspection.status === 409, "unassigned driver cannot submit a vehicle inspection");

    const criticalSubmission = {
      ...validSubmission,
      type: "post_trip",
      odometerKm: 48310,
      clientSubmissionId: randomUUID(),
      checklist: truckChecklist.map((item) => item.id === "service-brakes"
        ? { itemId: item.id, result: "fail", description: "Brake warning and reduced pressure", severity: "minor" }
        : { itemId: item.id, result: "pass" }),
    };
    const criticalResponse = await request(
      baseUrl,
      "POST",
      "/api/drivers/me/inspections",
      driverACookie,
      criticalSubmission
    );
    const criticalReport = await Inspection.findById(criticalResponse.body.data?._id);
    const vehicleAfterCritical = await Vehicle.findById(vehicleA._id).lean();
    const blockedTrip = await request(baseUrl, "POST", "/api/transport", managerCookie, {
      vehiclePlate: vehicleA.plateNumber,
      assignedDriver: driverA.fullName,
      origin: "Nairobi",
      destination: "Mombasa",
    });
    const unsafeTripProgress = await request(
      baseUrl,
      "PATCH",
      `/api/transport/${permittedMinorDispatch.body.data._id}`,
      managerCookie,
      { status: "in_transit" }
    );
    const stopUnsafeTrip = await request(
      baseUrl,
      "PATCH",
      `/api/transport/${permittedMinorDispatch.body.data._id}`,
      managerCookie,
      { status: "delayed" }
    );
    assertPass(
      criticalResponse.status === 201 &&
        criticalReport?.outcome === "failed" &&
        criticalReport.defects[0]?.severity === "critical" &&
        vehicleAfterCritical?.safetyState === "out_of_service" &&
        vehicleAfterCritical?.safetyHistory?.at(-1)?.changedBy?.toString() === driverAUser._id.toString() &&
        blockedTrip.status === 409 &&
        unsafeTripProgress.status === 409 &&
        stopUnsafeTrip.status === 200,
      "critical defects place the vehicle out of service, block dispatch and continued trip progress, and let dispatchers record a stop/delay"
    );

    const criticalDefect = criticalResponse.body.data.defects[0] as { _id: string };
    const managerReviewDenied = await request(
      baseUrl,
      "POST",
      `/api/inspections/${criticalResponse.body.data._id}/review`,
      viewerCookie,
      { reviewedOutcome: "failed", safetyDecision: "out_of_service", defectUpdates: [] }
    );
    const workOrderResponse = await request(
      baseUrl,
      "POST",
      `/api/inspections/${criticalResponse.body.data._id}/defects/${criticalDefect._id}/work-order`,
      managerCookie,
      {}
    );
    const repeatedWorkOrder = await request(
      baseUrl,
      "POST",
      `/api/inspections/${criticalResponse.body.data._id}/defects/${criticalDefect._id}/work-order`,
      managerCookie,
      {}
    );
    const criticalWorkOrder = await MaintenanceLog.findOne({ sourceDefectId: criticalDefect._id });
    const incompleteRepairReview = await request(
      baseUrl,
      "POST",
      `/api/inspections/${criticalResponse.body.data._id}/review`,
      managerCookie,
      {
        reviewedOutcome: "passed",
        safetyDecision: "available",
        defectUpdates: [{ defectId: criticalDefect._id, status: "resolved" }],
      }
    );
    assertPass(
      managerReviewDenied.status === 403 &&
        workOrderResponse.status === 201 &&
        repeatedWorkOrder.status === 200 &&
        criticalWorkOrder?.priority === "urgent" &&
        criticalWorkOrder?.sourceInspectionId?.toString() === criticalReport?._id.toString() &&
        incompleteRepairReview.status === 409,
      "review authorization is enforced, defect work orders are idempotently linked, and incomplete repairs cannot clear a critical defect"
    );

    const completeWorkOrder = await request(
      baseUrl,
      "PATCH",
      `/api/maintenance/${criticalWorkOrder?._id.toString()}`,
      managerCookie,
      { status: "completed", completedDate: new Date().toISOString() }
    );
    const clearCriticalVehicle = await request(
      baseUrl,
      "POST",
      `/api/inspections/${criticalResponse.body.data._id}/review`,
      managerCookie,
      {
        reviewedOutcome: "passed",
        safetyDecision: "available",
        notes: "Completed repair inspected and verified.",
        defectUpdates: [{ defectId: criticalDefect._id, status: "resolved" }],
      }
    );
    const clearedVehicle = await Vehicle.findById(vehicleA._id).lean();
    const dispatchAfterClear = await request(baseUrl, "POST", "/api/transport", managerCookie, {
      vehiclePlate: vehicleA.plateNumber,
      assignedDriver: driverA.fullName,
      origin: "Nairobi",
      destination: "Mombasa",
    });
    assertPass(
      completeWorkOrder.status === 200 &&
        clearCriticalVehicle.status === 200 &&
        clearedVehicle?.safetyState === "available" &&
        clearCriticalVehicle.body.data.reviewHistory.at(-1)?.reviewerName === fleetManager.name &&
        clearCriticalVehicle.body.data.defects[0]?.history.at(-1)?.actorName === fleetManager.name &&
        dispatchAfterClear.status === 201,
      "only a completed, linked repair can be manager-verified, clear the vehicle, and allow dispatch"
    );

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
    const foreignOwner = await User.findById(otherOrganization.user.userId);
    if (!foreignOwner) throw new Error("Foreign organization owner was not created.");
    const foreignInspectionReview = await request(
      baseUrl,
      "POST",
      `/api/inspections/${criticalResponse.body.data._id}/review`,
      await createSession(foreignOwner),
      { reviewedOutcome: "failed", safetyDecision: "out_of_service", defectUpdates: [] }
    );
    assertPass(
      foreignInspectionReview.status === 404,
      "a manager from another organization cannot review an inspection outside the tenant boundary"
    );
    const foreignVehicle = await Vehicle.create({
      vin: "PORTALFOREIGNVIN001",
      plateNumber: `PORTALX${Date.now().toString().slice(-5)}`,
      make: "DAF",
      model: "XF",
      year: 2020,
      type: "truck",
      status: "active",
      organizationId: otherOrganization.user.organizationId,
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

    const prelinkedDriver = await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${linkableDriver._id.toString()}`,
      managerCookie,
      { linkedUserId: linkableDriverUser._id.toString() }
    );
    assertPass(prelinkedDriver.status === 200, "authorized manager can link the existing driver account before assignment changes");

    const unauthorizedAssignment = await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${linkableDriver._id.toString()}`,
      driverACookie,
      { assignedVehicleId: vehicleA._id.toString() }
    );
    assertPass(unauthorizedAssignment.status === 403, "driver cannot change a driver vehicle assignment");

    const assignedToVehicleA = await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${linkableDriver._id.toString()}`,
      managerCookie,
      { assignedVehicleId: vehicleA._id.toString() }
    );
    const fetchedAfterAssign = await request(
      baseUrl,
      "GET",
      `/api/drivers/${linkableDriver._id.toString()}`,
      ownerCookie
    );
    const rosterAfterAssign = await request(baseUrl, "GET", "/api/drivers", ownerCookie);
    const rosterDriverAfterAssign = rosterAfterAssign.body.data.find(
      (driver: { _id: string }) => driver._id === linkableDriver._id.toString()
    );
    assertPass(
      assignedToVehicleA.status === 200 &&
        fetchedAfterAssign.body.data.assignedVehicleId?.toString() === vehicleA._id.toString() &&
        fetchedAfterAssign.body.data.linkedUserId?.toString() === linkableDriverUser._id.toString() &&
        rosterDriverAfterAssign?.assignedVehicle === vehicleA.plateNumber,
      "authorized manager assigns an existing driver without clearing its linked account; refreshed detail and roster show persisted vehicle"
    );

    const changedToVehicleB = await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${linkableDriver._id.toString()}`,
      managerCookie,
      { assignedVehicleId: vehicleB._id.toString() }
    );
    const fetchedAfterChange = await request(
      baseUrl,
      "GET",
      `/api/drivers/${linkableDriver._id.toString()}`,
      ownerCookie
    );
    assertPass(
      changedToVehicleB.status === 200 &&
        fetchedAfterChange.body.data.assignedVehicleId?.toString() === vehicleB._id.toString(),
      "authorized manager can change an existing assignment and the new vehicle persists"
    );

    const foreignVehicleAssignment = await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${linkableDriver._id.toString()}`,
      managerCookie,
      { assignedVehicleId: foreignVehicle._id.toString() }
    );
    const nonexistentVehicleAssignment = await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${linkableDriver._id.toString()}`,
      managerCookie,
      { assignedVehicleId: new mongoose.Types.ObjectId().toString() }
    );
    assertPass(
      foreignVehicleAssignment.status === 400 && nonexistentVehicleAssignment.status === 400,
      "assignment rejects vehicles outside the organization and nonexistent vehicle IDs"
    );

    const removedVehicleAssignment = await request(
      baseUrl,
      "PATCH",
      `/api/drivers/${linkableDriver._id.toString()}`,
      managerCookie,
      { assignedVehicleId: null }
    );
    const fetchedAfterRemoval = await request(
      baseUrl,
      "GET",
      `/api/drivers/${linkableDriver._id.toString()}`,
      ownerCookie
    );
    const rosterAfterRemoval = await request(baseUrl, "GET", "/api/drivers", ownerCookie);
    const rosterDriverAfterRemoval = rosterAfterRemoval.body.data.find(
      (driver: { _id: string }) => driver._id === linkableDriver._id.toString()
    );
    assertPass(
      removedVehicleAssignment.status === 200 &&
        !fetchedAfterRemoval.body.data.assignedVehicleId &&
        rosterDriverAfterRemoval?.assignedVehicle === undefined,
      "authorized manager can remove an assignment and refreshed detail and roster show unassigned"
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
