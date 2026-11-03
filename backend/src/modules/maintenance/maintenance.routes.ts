import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { IMaintenanceLog, MaintenanceLog } from "./maintenance.model";
import { MaintenanceCreateSchema, MaintenanceUpdateSchema } from "./maintenance.schema";
import { Vehicle } from "../vehicle/vehicle.model";
import { authorize } from "../auth/authorization.middleware";
import { requireDatabase, requireOrganization } from "../auth/tenant.middleware";

const router = Router();
router.use(requireDatabase, requireOrganization);

const organizationId = (req: Request): string => req.user!.organizationId!;

router.get("/", authorize("maintenance", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const query: Record<string, unknown> = { organizationId: organizationId(req) };
    if (typeof req.query.vehicleId === "string") {
      if (!mongoose.isValidObjectId(req.query.vehicleId)) {
        res.json({ success: true, count: 0, data: [] });
        return;
      }
      query.vehicleId = req.query.vehicleId;
    }
    const records = await MaintenanceLog.find(query).sort({ scheduledDate: -1 }).lean();
    const vehicleIds = [...new Set(records.map((record) => record.vehicleId.toString()))];
    const vehicles = await Vehicle.find({
      _id: { $in: vehicleIds },
      organizationId: organizationId(req),
    }).select("_id plateNumber").lean();
    const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle._id.toString(), vehicle]));
    const data = records.map((record) => ({
      ...record,
      vehiclePlate: record.vehiclePlateSnapshot || vehiclesById.get(record.vehicleId.toString())?.plateNumber || null,
      costRecorded: record.costRecorded === true || (typeof record.cost === "number" && record.cost > 0),
    }));
    res.json({ success: true, count: data.length, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch maintenance records." });
  }
});

router.post("/", authorize("maintenance", "create"), async (req: Request, res: Response): Promise<void> => {
  const parsed = MaintenanceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  if (!mongoose.isValidObjectId(parsed.data.vehicleId)) {
    res.status(400).json({ success: false, message: "Vehicle ID is invalid." });
    return;
  }
  try {
    const vehicle = await Vehicle.findOne({
      _id: parsed.data.vehicleId,
      organizationId: organizationId(req),
    }).select("_id plateNumber").lean();
    if (!vehicle) {
      res.status(400).json({ success: false, message: "Vehicle must belong to your organization." });
      return;
    }
    const created = await MaintenanceLog.create({
      ...parsed.data,
      organizationId: organizationId(req),
      vehiclePlateSnapshot: vehicle.plateNumber,
      costRecorded: parsed.data.cost !== undefined,
      scheduledDate: new Date(parsed.data.scheduledDate),
      completedDate: parsed.data.completedDate ? new Date(parsed.data.completedDate) : undefined,
    });
    res.status(201).json({
      success: true,
      data: {
        ...created.toObject(),
        vehiclePlate: created.vehiclePlateSnapshot,
        costRecorded: created.costRecorded === true || (typeof created.cost === "number" && created.cost > 0),
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create maintenance record." });
  }
});

router.patch("/:id", authorize("maintenance", "update"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Maintenance record not found." });
    return;
  }
  const parsed = MaintenanceUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const existing = await MaintenanceLog.findOne({
      _id: req.params.id,
      organizationId: organizationId(req),
    }).lean<IMaintenanceLog>();
    if (!existing) {
      res.status(404).json({ success: false, message: "Maintenance record not found." });
      return;
    }
    let updatedVehiclePlate: string | undefined;
    if (parsed.data.vehicleId) {
      if (!mongoose.isValidObjectId(parsed.data.vehicleId)) {
        res.status(400).json({ success: false, message: "Vehicle ID is invalid." });
        return;
      }
      const vehicle = await Vehicle.findOne({
        _id: parsed.data.vehicleId,
        organizationId: organizationId(req),
      }).select("_id plateNumber").lean();
      if (!vehicle) {
        res.status(400).json({ success: false, message: "Vehicle must belong to your organization." });
        return;
      }
      if (
        existing.sourceDefectId &&
        parsed.data.vehicleId !== existing.vehicleId.toString()
      ) {
        res.status(409).json({ success: false, message: "Inspection-linked work orders cannot be reassigned to another vehicle." });
        return;
      }
      if (parsed.data.vehicleId !== existing.vehicleId.toString()) {
        updatedVehiclePlate = vehicle.plateNumber;
      }
    }
    const updates: Record<string, unknown> = { ...parsed.data };
    if (updatedVehiclePlate) updates.vehiclePlateSnapshot = updatedVehiclePlate;
    if (parsed.data.cost !== undefined) updates.costRecorded = true;
    if (parsed.data.scheduledDate) updates.scheduledDate = new Date(parsed.data.scheduledDate);
    if (parsed.data.completedDate) updates.completedDate = new Date(parsed.data.completedDate);
    const updated = await MaintenanceLog.findOneAndUpdate(
      { _id: req.params.id, organizationId: organizationId(req) },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean<IMaintenanceLog>();
    if (!updated) {
      res.status(404).json({ success: false, message: "Maintenance record not found." });
      return;
    }
    const vehicle = updated.vehiclePlateSnapshot
      ? null
      : await Vehicle.findOne({
          _id: updated.vehicleId,
          organizationId: organizationId(req),
        }).select("plateNumber").lean();
    res.json({
      success: true,
      data: {
        ...updated,
        vehiclePlate: updated.vehiclePlateSnapshot || vehicle?.plateNumber || null,
        costRecorded: updated.costRecorded === true || (typeof updated.cost === "number" && updated.cost > 0),
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update maintenance record." });
  }
});

export const maintenanceRoutes = router;
