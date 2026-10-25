import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Driver } from "./driver.model";
import { DriverCreateSchema, DriverUpdateSchema } from "./driver.schema";
import { Vehicle } from "../vehicle/vehicle.model";
import { authorize } from "../auth/authorization.middleware";
import { requireDatabase, requireOrganization } from "../auth/tenant.middleware";

const router = Router();
router.use(requireDatabase, requireOrganization);

const organizationId = (req: Request): string => req.user!.organizationId!;

router.get("/", authorize("drivers", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const drivers = await Driver.find({ organizationId: organizationId(req) }).sort({ fullName: 1 }).lean();
    res.json({ success: true, count: drivers.length, data: drivers });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch drivers." });
  }
});

router.get("/:id", authorize("drivers", "read"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Driver not found." });
    return;
  }
  try {
    const driver = await Driver.findOne({
      _id: req.params.id,
      organizationId: organizationId(req),
    }).lean();
    if (!driver) {
      res.status(404).json({ success: false, message: "Driver not found." });
      return;
    }
    res.json({ success: true, data: driver });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch driver." });
  }
});

router.post("/", authorize("drivers", "create"), async (req: Request, res: Response): Promise<void> => {
  const parsed = DriverCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    if (parsed.data.assignedVehicleId) {
      if (!mongoose.isValidObjectId(parsed.data.assignedVehicleId)) {
        res.status(400).json({ success: false, message: "Assigned vehicle ID is invalid." });
        return;
      }
      const vehicle = await Vehicle.findOne({
        _id: parsed.data.assignedVehicleId,
        organizationId: organizationId(req),
      }).select("_id").lean();
      if (!vehicle) {
        res.status(400).json({ success: false, message: "Assigned vehicle must belong to your organization." });
        return;
      }
    }
    const created = await Driver.create({ ...parsed.data, organizationId: organizationId(req) });
    res.status(201).json({ success: true, data: created });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create driver." });
  }
});

router.patch("/:id", authorize("drivers", "update"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Driver not found." });
    return;
  }
  const parsed = DriverUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    if (parsed.data.assignedVehicleId) {
      if (!mongoose.isValidObjectId(parsed.data.assignedVehicleId)) {
        res.status(400).json({ success: false, message: "Assigned vehicle ID is invalid." });
        return;
      }
      const vehicle = await Vehicle.findOne({
        _id: parsed.data.assignedVehicleId,
        organizationId: organizationId(req),
      }).select("_id").lean();
      if (!vehicle) {
        res.status(400).json({ success: false, message: "Assigned vehicle must belong to your organization." });
        return;
      }
    }
    const updated = await Driver.findOneAndUpdate(
      { _id: req.params.id, organizationId: organizationId(req) },
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ success: false, message: "Driver not found." });
      return;
    }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update driver." });
  }
});

export const driverRoutes = router;
