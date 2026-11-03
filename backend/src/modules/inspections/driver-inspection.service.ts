import { createHash } from "crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { Driver } from "../drivers/driver.model";
import { Vehicle } from "../vehicle/vehicle.model";
import { Inspection } from "./inspection.model";
import { getChecklistForVehicle } from "./inspection-checklist";

export const DriverInspectionSubmissionSchema = z.object({
  type: z.enum(["pre_trip", "post_trip"]),
  odometerKm: z.number().int().nonnegative(),
  clientSubmissionId: z.string().uuid(),
  driverAttested: z.literal(true),
  checklist: z.array(z.object({
    itemId: z.string().min(1).max(100),
    result: z.enum(["pass", "fail"]),
    description: z.string().trim().max(1000).optional(),
    severity: z.enum(["minor", "major"]).optional(),
  }).strict()).min(1).max(30),
}).strict();

export type DriverInspectionSubmission = z.infer<typeof DriverInspectionSubmissionSchema>;

type LinkedDriver = {
  _id: mongoose.Types.ObjectId;
  assignedVehicleId?: mongoose.Types.ObjectId;
};

type AssignedVehicle = {
  _id: mongoose.Types.ObjectId;
  plateNumber: string;
  type: string;
  status: string;
  safetyState?: string;
  telematicsData?: { odometerKm?: number };
};

export async function submitDriverInspection(input: {
  submission: DriverInspectionSubmission;
  organizationId: string;
  userId: string;
  inspectorName: string;
}) {
  const driver = await Driver.findOne({
    linkedUserId: input.userId,
    organizationId: input.organizationId,
    status: "active",
  }).select("_id assignedVehicleId").lean<LinkedDriver | null>();
  if (!driver) {
    return { status: 404 as const, message: "No active driver profile is linked to this account." };
  }
  const tenantId = new mongoose.Types.ObjectId(input.organizationId);
  const submissionHash = createHash("sha256").update(JSON.stringify({
    type: input.submission.type,
    odometerKm: input.submission.odometerKm,
    driverAttested: input.submission.driverAttested,
    checklist: [...input.submission.checklist].sort((a, b) => a.itemId.localeCompare(b.itemId)),
  })).digest("hex");
  const existing = await Inspection.findOne({
    organizationId: tenantId,
    clientSubmissionId: input.submission.clientSubmissionId,
  });
  if (existing) {
    if (
      existing.driverId?.toString() !== driver._id.toString() ||
      !existing.vehicleId ||
      existing.submissionHash !== submissionHash
    ) {
      return { status: 409 as const, message: "This submission identifier is already in use." };
    }
    const previousVehicle = await Vehicle.findOne({
      _id: existing.vehicleId,
      organizationId: tenantId,
    }).select("_id").lean<{ _id: mongoose.Types.ObjectId } | null>();
    if (!previousVehicle) {
      return { status: 409 as const, message: "The vehicle linked to this inspection is unavailable." };
    }
    await applyVehicleSafetyState({
      vehicleId: previousVehicle._id,
      organizationId: tenantId,
      inspectionId: existing._id,
      changedBy: new mongoose.Types.ObjectId(input.userId),
      actorName: input.inspectorName,
      defects: existing.reviewHistory.length ? [] : existing.defects,
      odometerKm: existing.odometerKm ?? input.submission.odometerKm,
    });
    return { status: 200 as const, data: existing };
  }
  if (!driver.assignedVehicleId) {
    return { status: 409 as const, message: "No vehicle is assigned to this driver." };
  }
  const vehicle = await Vehicle.findOne({
    _id: driver.assignedVehicleId,
    organizationId: input.organizationId,
  }).select("_id plateNumber type status safetyState telematicsData.odometerKm").lean<AssignedVehicle | null>();
  if (!vehicle) {
    return { status: 404 as const, message: "The assigned vehicle is unavailable." };
  }
  const stillAssigned = await Driver.exists({
    _id: driver._id,
    assignedVehicleId: vehicle._id,
    linkedUserId: input.userId,
    organizationId: input.organizationId,
    status: "active",
  });
  if (!stillAssigned) {
    return { status: 409 as const, message: "The driver vehicle assignment changed. Reload your profile and retry." };
  }
  if (vehicle.status === "inactive") {
    return { status: 409 as const, message: "An inactive vehicle cannot be inspected for operation." };
  }
  const previousOdometer = vehicle.telematicsData?.odometerKm ?? 0;
  if (input.submission.odometerKm < previousOdometer) {
    return { status: 409 as const, message: "The submitted odometer cannot be lower than the recorded vehicle odometer." };
  }

  const items = getChecklistForVehicle(vehicle.type);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const responses = input.submission.checklist;
  if (
    responses.length !== items.length ||
    new Set(responses.map((response) => response.itemId)).size !== responses.length ||
    responses.some((response) => !itemById.has(response.itemId))
  ) {
    return { status: 400 as const, message: "Complete each applicable inspection checklist item exactly once." };
  }
  if (responses.some((response) =>
    response.result === "fail" && !response.description?.trim()
  )) {
    return { status: 400 as const, message: "Describe every failed checklist item." };
  }

  const now = new Date();
  const defects = responses
    .filter((response) => response.result === "fail")
    .map((response) => {
      const item = itemById.get(response.itemId)!;
      return {
        itemId: item.id,
        category: item.category,
        description: response.description!.trim(),
        severity: item.critical ? "critical" as const : response.severity || "major" as const,
        status: "open" as const,
        reportedAt: now,
        history: [{
          status: "open" as const,
          changedBy: new mongoose.Types.ObjectId(input.userId),
          actorName: input.inspectorName,
          changedAt: now,
          note: "Reported during driver inspection.",
        }],
      };
    });
  const hasCritical = defects.some((defect) => defect.severity === "critical");
  const outcome = defects.length > 0 ? "failed" : "passed";
  const inspectionId = new mongoose.Types.ObjectId();
  const reportNumber = `EDVIR-${inspectionId.toHexString().toUpperCase()}`;
  const inspectionData = {
    _id: inspectionId,
    organizationId: tenantId,
    reportNumber,
    vehiclePlate: vehicle.plateNumber,
    vehicleId: vehicle._id,
    driverId: driver._id,
    inspectorName: input.inspectorName,
    type: input.submission.type,
    outcome,
    defectsSummary: defects.map((defect) => `${defect.category}: ${defect.description}`).join("; "),
    date: now.toISOString(),
    odometerKm: input.submission.odometerKm,
    checklist: responses,
    defects,
    clientSubmissionId: input.submission.clientSubmissionId,
    submissionHash,
    submittedAt: now,
    driverAttested: true,
    attestedBy: new mongoose.Types.ObjectId(input.userId),
    attestedAt: now,
  };

  await applyVehicleSafetyState({
    vehicleId: vehicle._id,
    organizationId: tenantId,
    inspectionId,
    changedBy: new mongoose.Types.ObjectId(input.userId),
    actorName: input.inspectorName,
    defects,
    odometerKm: input.submission.odometerKm,
  });
  try {
    const inspection = await Inspection.create(inspectionData);
    return { status: 201 as const, data: inspection };
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    const concurrentSubmission = await Inspection.findOne({
      organizationId: tenantId,
      clientSubmissionId: input.submission.clientSubmissionId,
    });
    if (concurrentSubmission?.submissionHash === submissionHash) {
      return { status: 200 as const, data: concurrentSubmission };
    }
    if (concurrentSubmission) {
      return { status: 409 as const, message: "This submission identifier is already in use." };
    }
    throw error;
  }
}

async function applyVehicleSafetyState(input: {
  vehicleId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  inspectionId: mongoose.Types.ObjectId;
  changedBy: mongoose.Types.ObjectId;
  actorName: string;
  defects: Array<{ severity: string; status?: string }>;
  odometerKm: number;
}) {
  const unresolved = input.defects.filter(
    (defect) => !("status" in defect) || defect.status !== "resolved"
  );
  const critical = unresolved.some((defect) => defect.severity === "critical");
  const target = critical ? "out_of_service" : unresolved.length > 0 ? "restricted" : undefined;
  const setFields: Record<string, unknown> = {};
  const baseUpdate: Record<string, unknown> = {
    $max: { "telematicsData.odometerKm": input.odometerKm },
    $inc: { safetyVersion: 1 },
  };
  if (target) {
    setFields.safetyState = target;
    baseUpdate.$set = setFields;
    baseUpdate.$push = {
      safetyHistory: {
        state: target,
        reason: critical
          ? "Critical defect reported in driver inspection."
          : "Major defect reported in driver inspection; assessment required.",
        inspectionId: input.inspectionId,
        changedBy: input.changedBy,
        actorName: input.actorName,
        changedAt: new Date(),
      },
    };
  }
  const query = {
    _id: input.vehicleId,
    organizationId: input.organizationId,
    ...(target === "restricted" ? { safetyState: { $nin: ["restricted", "out_of_service"] } } : {}),
    ...(target === "out_of_service" ? { safetyState: { $ne: "out_of_service" } } : {}),
  };
  const result = await Vehicle.updateOne(query, baseUpdate);
  if (result.matchedCount === 1) return;
  if (target) {
    const fallback = await Vehicle.updateOne(
      { _id: input.vehicleId, organizationId: input.organizationId },
      {
        $max: { "telematicsData.odometerKm": input.odometerKm },
        $inc: { safetyVersion: 1 },
      }
    );
    if (fallback.matchedCount === 1) return;
  }
  throw new Error("Assigned vehicle disappeared before the safety state could be recorded.");
}
