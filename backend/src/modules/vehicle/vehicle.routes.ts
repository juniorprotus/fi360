import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Vehicle } from "./vehicle.model";
import { VehicleCreateSchema, VehicleUpdateSchema } from "./vehicle.schema";
import { authorize } from "../auth/authorization.middleware";
import { requireDatabase, requireOrganization } from "../auth/tenant.middleware";

const router = Router();
router.use(requireDatabase, requireOrganization);

const organizationId = (req: Request): string => req.user!.organizationId!;

router.get("/", authorize("vehicles", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await Vehicle.find({ organizationId: organizationId(req) }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, count: vehicles.length, data: vehicles });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch vehicles." });
  }
});

router.get("/metrics", authorize("vehicles", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await Vehicle.find({ organizationId: organizationId(req) }).select("status").lean();
    const metrics: Record<string, number> = {
      active: 0,
      maintenance: 0,
      critical_failure: 0,
      inactive: 0,
    };
    for (const vehicle of vehicles) {
      metrics[vehicle.status] = (metrics[vehicle.status] ?? 0) + 1;
    }
    res.json({ success: true, data: metrics });
  } catch {
    res.status(500).json({ success: false, message: "Failed to calculate vehicle metrics." });
  }
});

router.get("/:id", authorize("vehicles", "read"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Vehicle not found." });
    return;
  }
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      organizationId: organizationId(req),
    }).lean();
    if (!vehicle) {
      res.status(404).json({ success: false, message: "Vehicle not found." });
      return;
    }
    res.json({ success: true, data: vehicle });
  } catch {
    res.status(500).json({ success: false, message: "Failed to retrieve vehicle." });
  }
});

router.post("/", authorize("vehicles", "create"), async (req: Request, res: Response): Promise<void> => {
  const parsed = VehicleCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const created = await Vehicle.create({ ...parsed.data, organizationId: organizationId(req) });
    res.status(201).json({ success: true, data: created });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create vehicle." });
  }
});

router.patch("/:id", authorize("vehicles", "update"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Vehicle not found." });
    return;
  }
  const parsed = VehicleUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const updated = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, organizationId: organizationId(req) },
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ success: false, message: "Vehicle not found." });
      return;
    }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update vehicle." });
  }
});

router.delete("/:id", authorize("vehicles", "delete"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Vehicle not found." });
    return;
  }
  try {
    const deleted = await Vehicle.findOneAndDelete({
      _id: req.params.id,
      organizationId: organizationId(req),
    });
    if (!deleted) {
      res.status(404).json({ success: false, message: "Vehicle not found." });
      return;
    }
    res.json({ success: true, message: "Vehicle deleted successfully." });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete vehicle." });
  }
});

export const vehicleRoutes = router;
