import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { MaintenanceLog } from "./maintenance.model";
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
    res.json({ success: true, count: records.length, data: records });
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
    }).select("_id").lean();
    if (!vehicle) {
      res.status(400).json({ success: false, message: "Vehicle must belong to your organization." });
      return;
    }
    const created = await MaintenanceLog.create({
      ...parsed.data,
      organizationId: organizationId(req),
      scheduledDate: new Date(parsed.data.scheduledDate),
      completedDate: parsed.data.completedDate ? new Date(parsed.data.completedDate) : undefined,
    });
    res.status(201).json({ success: true, data: created });
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
    if (parsed.data.vehicleId) {
      if (!mongoose.isValidObjectId(parsed.data.vehicleId)) {
        res.status(400).json({ success: false, message: "Vehicle ID is invalid." });
        return;
      }
      const vehicle = await Vehicle.findOne({
        _id: parsed.data.vehicleId,
        organizationId: organizationId(req),
      }).select("_id").lean();
      if (!vehicle) {
        res.status(400).json({ success: false, message: "Vehicle must belong to your organization." });
        return;
      }
    }
    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.scheduledDate) updates.scheduledDate = new Date(parsed.data.scheduledDate);
    if (parsed.data.completedDate) updates.completedDate = new Date(parsed.data.completedDate);
    const updated = await MaintenanceLog.findOneAndUpdate(
      { _id: req.params.id, organizationId: organizationId(req) },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ success: false, message: "Maintenance record not found." });
      return;
    }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update maintenance record." });
  }
});

export const maintenanceRoutes = router;
