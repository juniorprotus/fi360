import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { Inspection } from "./inspection.model";
import { Vehicle } from "../vehicle/vehicle.model";
import { MaintenanceLog } from "../maintenance/maintenance.model";
import { authorize } from "../auth/authorization.middleware";
import { requireDatabase, requireOrganization } from "../auth/tenant.middleware";

const router = Router();
router.use(requireDatabase, requireOrganization);

const InspectionCreateSchema = z.object({
  reportNumber: z.string().trim().min(1).max(100).optional(),
  vehiclePlate: z.string().trim().min(2).max(20),
  inspectorName: z.string().trim().min(1).max(100).optional(),
  type: z.string().trim().min(1).max(100).default("Pre-Trip Walkaround"),
  outcome: z.enum(["passed", "failed", "requires_attention"]).default("passed"),
  defectsSummary: z.string().trim().max(1000).default("Zero critical defects noted."),
  date: z.string().min(1).max(40).optional(),
}).strict();

const InspectionReviewSchema = z.object({
  reviewedOutcome: z.enum(["passed", "passed_with_defects", "failed"]),
  safetyDecision: z.enum(["available", "restricted", "out_of_service"]),
  notes: z.string().trim().max(1000).default(""),
  defectUpdates: z.array(z.object({
    defectId: z.string().min(1),
    status: z.enum(["open", "awaiting_verification", "resolved"]),
  }).strict()).max(30).default([]),
}).strict();

const organizationId = (req: Request): string => req.user!.organizationId!;
type SafetyVehicle = {
  _id: mongoose.Types.ObjectId;
  safetyState?: string;
  safetyVersion?: number;
};

router.get("/", authorize("inspections", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await Inspection.find({ organizationId: organizationId(req) })
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ success: true, count: records.length, data: records });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch inspections." });
  }
});

router.post("/", authorize("inspections", "create"), async (req: Request, res: Response): Promise<void> => {
  const parsed = InspectionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  const plate = parsed.data.vehiclePlate.toUpperCase().trim();
  try {
    const vehicle = await Vehicle.findOne({
      plateNumber: plate,
      organizationId: organizationId(req),
    }).select("_id").lean();
    if (!vehicle) {
      res.status(400).json({ success: false, message: "Vehicle plate must belong to your organization." });
      return;
    }
    const created = await Inspection.create({
      ...parsed.data,
      reportNumber: parsed.data.reportNumber || `EDVIR-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      vehiclePlate: plate,
      inspectorName: req.user!.name,
      date: parsed.data.date || new Date().toISOString().replace("T", " ").substring(0, 16),
      organizationId: organizationId(req),
    });
    res.status(201).json({ success: true, data: created });
  } catch {
    res.status(500).json({ success: false, message: "Failed to record inspection." });
  }
});

router.post(
  "/:id/defects/:defectId/work-order",
  authorize("maintenance", "create"),
  async (req: Request, res: Response): Promise<void> => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: "Inspection not found." });
      return;
    }
    try {
      const inspection = await Inspection.findOne({
        _id: req.params.id,
        organizationId: organizationId(req),
      });
      if (!inspection) {
        res.status(404).json({ success: false, message: "Inspection not found." });
        return;
      }
      const defect = inspection.defects.find((item) => item._id?.toString() === req.params.defectId);
      if (!defect || !defect._id) {
        res.status(404).json({ success: false, message: "Inspection defect not found." });
        return;
      }
      if (defect.status === "resolved") {
        res.status(409).json({ success: false, message: "A verified defect cannot receive a new work order." });
        return;
      }
      if (!inspection.vehicleId || (!inspection.odometerKm && inspection.odometerKm !== 0)) {
        res.status(409).json({ success: false, message: "This inspection has no linked vehicle or odometer record." });
        return;
      }
      const vehicle = await Vehicle.findOne({
        _id: inspection.vehicleId,
        organizationId: organizationId(req),
      }).select("_id plateNumber").lean();
      if (!vehicle) {
        res.status(409).json({ success: false, message: "The inspection vehicle is no longer available." });
        return;
      }
      const existing = await MaintenanceLog.findOne({
        organizationId: organizationId(req),
        sourceDefectId: defect._id.toString(),
      });
      if (existing) {
        if (
          existing.sourceInspectionId?.toString() !== inspection._id.toString() ||
          existing.vehicleId.toString() !== inspection.vehicleId.toString()
        ) {
          res.status(409).json({ success: false, message: "The linked work order does not match this inspection vehicle." });
          return;
        }
        if (!defect.workOrderId || defect.workOrderId.toString() !== existing._id?.toString()) {
          defect.workOrderId = existing._id as mongoose.Types.ObjectId;
          defect.status = "work_order_created";
          defect.history.push({
            status: "work_order_created",
            changedBy: new mongoose.Types.ObjectId(req.user!.userId),
            actorName: req.user!.name,
            changedAt: new Date(),
            workOrderId: existing._id as mongoose.Types.ObjectId,
            note: "Linked existing defect work order.",
          });
          await inspection.save();
        }
        res.json({ success: true, data: existing });
        return;
      }
      const priority = defect.severity === "critical" ? "urgent" : defect.severity === "major" ? "high" : "medium";
      const type = /brake/i.test(defect.category)
        ? "brake_system"
        : /tyre|wheel/i.test(defect.category)
          ? "tyre_rotation"
          : "emergency_repair";
      let workOrder;
      try {
        workOrder = await MaintenanceLog.findOneAndUpdate(
          {
            organizationId: organizationId(req),
            sourceDefectId: defect._id.toString(),
          },
          {
            $setOnInsert: {
              organizationId: organizationId(req),
              vehicleId: inspection.vehicleId,
              type,
              status: "scheduled",
              priority,
              description: `${defect.category}: ${defect.description}`,
              scheduledDate: new Date(),
              odometerKmAtService: inspection.odometerKm,
              sourceInspectionId: inspection._id,
              sourceDefectId: defect._id.toString(),
              vehiclePlateSnapshot: inspection.vehiclePlate || vehicle.plateNumber,
            },
          },
          { new: true, upsert: true, runValidators: true }
        );
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        workOrder = await MaintenanceLog.findOne({
          organizationId: organizationId(req),
          sourceDefectId: defect._id.toString(),
        });
        if (
          workOrder &&
          (workOrder.sourceInspectionId?.toString() !== inspection._id.toString() ||
            workOrder.vehicleId.toString() !== inspection.vehicleId.toString())
        ) {
          res.status(409).json({ success: false, message: "The linked work order does not match this inspection vehicle." });
          return;
        }
      }
      if (!workOrder) {
        res.status(503).json({ success: false, message: "Could not create or retrieve the defect work order." });
        return;
      }
      defect.workOrderId = workOrder._id as mongoose.Types.ObjectId;
      defect.status = "work_order_created";
      defect.history.push({
        status: "work_order_created",
        changedBy: new mongoose.Types.ObjectId(req.user!.userId),
        actorName: req.user!.name,
        changedAt: new Date(),
        workOrderId: workOrder._id as mongoose.Types.ObjectId,
        note: "Maintenance work order created.",
      });
      await inspection.save();
      res.status(201).json({ success: true, data: workOrder });
    } catch {
      res.status(500).json({ success: false, message: "Failed to create a defect work order." });
    }
  }
);

router.post("/:id/review", authorize("inspections", "update"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Inspection not found." });
    return;
  }
  const parsed = InspectionReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const inspection = await Inspection.findOne({
      _id: req.params.id,
      organizationId: organizationId(req),
    });
    if (!inspection) {
      res.status(404).json({ success: false, message: "Inspection not found." });
      return;
    }
    if (!inspection.vehicleId) {
      res.status(409).json({ success: false, message: "This legacy inspection has no linked vehicle for a safety review." });
      return;
    }
    const vehicle = await Vehicle.findOne({
      _id: inspection.vehicleId,
      organizationId: organizationId(req),
    }).select("_id safetyState safetyVersion").lean<SafetyVehicle | null>();
    if (!vehicle) {
      res.status(409).json({ success: false, message: "The inspection vehicle is no longer available." });
      return;
    }
    if (new Set(parsed.data.defectUpdates.map((item) => item.defectId)).size !== parsed.data.defectUpdates.length) {
      res.status(400).json({ success: false, message: "A defect may only be updated once per review." });
      return;
    }
    const defectById = new Map(inspection.defects.map((defect) => [defect._id?.toString(), defect]));
    for (const change of parsed.data.defectUpdates) {
      const defect = defectById.get(change.defectId);
      if (!defect) {
        res.status(400).json({ success: false, message: "Review references a defect outside this inspection." });
        return;
      }
      if (change.status === "resolved") {
        if (!defect.workOrderId) {
          res.status(409).json({ success: false, message: "Create a maintenance work order before verifying this defect." });
          return;
        }
        const workOrder = await MaintenanceLog.findOne({
          _id: defect.workOrderId,
          organizationId: organizationId(req),
          sourceInspectionId: inspection._id,
          sourceDefectId: defect._id?.toString(),
          vehicleId: inspection.vehicleId,
          status: "completed",
        }).select("_id").lean();
        if (!workOrder) {
          res.status(409).json({ success: false, message: "The linked work order must be completed before the repair can be verified." });
          return;
        }
      }
    }

    const currentStatuses = new Map(inspection.defects.map((defect) => [defect._id?.toString(), defect.status]));
    for (const change of parsed.data.defectUpdates) {
      currentStatuses.set(change.defectId, change.status);
    }
    const unresolvedSafetyDefect = inspection.defects.some((defect) =>
      (defect.severity === "critical" || defect.severity === "major") &&
      currentStatuses.get(defect._id?.toString()) !== "resolved"
    );
    const unresolvedDefect = inspection.defects.some(
      (defect) => currentStatuses.get(defect._id?.toString()) !== "resolved"
    );
    if (parsed.data.reviewedOutcome === "passed" && unresolvedDefect) {
      res.status(409).json({ success: false, message: "Resolve all reported defects before marking the inspection as passed." });
      return;
    }
    if (parsed.data.reviewedOutcome === "passed_with_defects" && unresolvedSafetyDefect) {
      res.status(409).json({ success: false, message: "Major and critical defects require a failed outcome until verified resolved." });
      return;
    }
    if (parsed.data.safetyDecision === "available" && unresolvedSafetyDefect) {
      res.status(409).json({ success: false, message: "Resolve all major and critical defects before clearing this vehicle." });
      return;
    }
    if (parsed.data.safetyDecision === "available") {
      const otherUnresolvedInspection = await Inspection.exists({
        organizationId: organizationId(req),
        vehicleId: inspection.vehicleId,
        _id: { $ne: inspection._id },
        defects: {
          $elemMatch: {
            severity: { $in: ["critical", "major"] },
            status: { $ne: "resolved" },
          },
        },
      });
      if (otherUnresolvedInspection) {
        res.status(409).json({ success: false, message: "Other inspections still have unresolved major or critical defects for this vehicle." });
        return;
      }
    }

    const now = new Date();
    const set: Record<string, unknown> = {
      reviewedOutcome: parsed.data.reviewedOutcome,
    };
    const unset: Record<string, ""> = {};
    for (const [index, change] of parsed.data.defectUpdates.entries()) {
      const identifier = `d${index}`;
      set[`defects.$[${identifier}].status`] = change.status;
      if (change.status === "resolved") {
        set[`defects.$[${identifier}].verifiedBy`] = req.user!.userId;
        set[`defects.$[${identifier}].verifiedAt`] = now;
      } else {
        unset[`defects.$[${identifier}].verifiedBy`] = "";
        unset[`defects.$[${identifier}].verifiedAt`] = "";
      }
    }
    const reviewEntry = {
      reviewerId: req.user!.userId,
      reviewerName: req.user!.name,
      reviewedAt: now,
      notes: parsed.data.notes,
      safetyDecision: parsed.data.safetyDecision,
      reviewedOutcome: parsed.data.reviewedOutcome,
      defectUpdates: parsed.data.defectUpdates,
    };
    const push: Record<string, unknown> = { reviewHistory: reviewEntry };
    for (const [index, change] of parsed.data.defectUpdates.entries()) {
      const defect = defectById.get(change.defectId)!;
      if (defect.status === change.status) continue;
      const identifier = `d${index}`;
      push[`defects.$[${identifier}].history`] = {
        status: change.status,
        changedBy: new mongoose.Types.ObjectId(req.user!.userId),
        actorName: req.user!.name,
        changedAt: now,
        ...(defect.workOrderId ? { workOrderId: defect.workOrderId } : {}),
        note: parsed.data.notes,
      };
    }
    const arrayFilters = parsed.data.defectUpdates.map((change, index) => ({
      [`d${index}._id`]: new mongoose.Types.ObjectId(change.defectId),
    }));

    if (parsed.data.safetyDecision !== "available") {
      const safetyUpdate = await Vehicle.updateOne(
        {
          _id: vehicle._id,
          organizationId: organizationId(req),
          safetyVersion: { $in: [vehicle.safetyVersion ?? 0, null] },
        },
        {
          $set: { safetyState: parsed.data.safetyDecision },
          $inc: { safetyVersion: 1 },
          $push: {
            safetyHistory: {
              state: parsed.data.safetyDecision,
              reason: parsed.data.notes || `Inspection ${inspection.reportNumber} reviewed.`,
              inspectionId: inspection._id,
              changedBy: req.user!.userId,
              actorName: req.user!.name,
              changedAt: now,
            },
          },
        }
      );
      if (safetyUpdate.modifiedCount !== 1) {
        res.status(409).json({ success: false, message: "Vehicle safety state changed during review. Reload and retry." });
        return;
      }
    }

    const updated = await Inspection.findOneAndUpdate(
      { _id: inspection._id, organizationId: organizationId(req) },
      {
        $set: set,
        ...(Object.keys(unset).length ? { $unset: unset } : {}),
        $push: push,
      },
      { new: true, runValidators: true, arrayFilters }
    ).lean();
    if (!updated) {
      res.status(404).json({ success: false, message: "Inspection not found." });
      return;
    }
    if (parsed.data.safetyDecision === "available") {
      const safetyUpdate = await Vehicle.updateOne(
        {
          _id: vehicle._id,
          organizationId: organizationId(req),
          safetyVersion: { $in: [vehicle.safetyVersion ?? 0, null] },
        },
        {
          $set: { safetyState: "available" },
          $inc: { safetyVersion: 1 },
          $push: {
            safetyHistory: {
              state: "available",
              reason: parsed.data.notes || `Inspection ${inspection.reportNumber} safety clearance verified.`,
              inspectionId: inspection._id,
              changedBy: req.user!.userId,
              actorName: req.user!.name,
              changedAt: now,
            },
          },
        }
      );
      if (safetyUpdate.modifiedCount !== 1) {
        res.status(409).json({ success: false, message: "Vehicle safety state changed during review. Reload before clearing it." });
        return;
      }
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(
      "Inspection review failed:",
      error instanceof Error ? error.message : "Unknown inspection review error."
    );
    res.status(500).json({ success: false, message: "Failed to review inspection." });
  }
});

export const inspectionRoutes = router;
