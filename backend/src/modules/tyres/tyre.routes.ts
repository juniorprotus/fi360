import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Tyre } from "./tyre.model";
import { Vehicle } from "../vehicle/vehicle.model";
import { authorize } from "../auth/authorization.middleware";
import { requireDatabase, requireOrganization } from "../auth/tenant.middleware";

const router = Router();
router.use(requireDatabase, requireOrganization);

const TyreFields = {
  serialNumber: z.string().trim().min(1).max(100),
  vehiclePlate: z.string().trim().min(2).max(20),
  position: z.string().trim().min(1).max(100),
  brand: z.string().trim().min(1).max(100),
  treadDepthMm: z.number().nonnegative(),
  pressurePsi: z.number().nonnegative(),
  status: z.enum(["good", "warning", "critical_wear"]).default("good"),
};
const TyreCreateSchema = z.object(TyreFields).strict();
const TyreUpdateSchema = z.object({
  serialNumber: TyreFields.serialNumber.optional(),
  vehiclePlate: TyreFields.vehiclePlate.optional(),
  position: TyreFields.position.optional(),
  brand: TyreFields.brand.optional(),
  treadDepthMm: TyreFields.treadDepthMm.optional(),
  pressurePsi: TyreFields.pressurePsi.optional(),
  status: z.enum(["good", "warning", "critical_wear"]).optional(),
}).strict();

const organizationId = (req: Request): string => req.user!.organizationId!;

async function hasOwnedVehicle(plate: string, tenantId: string): Promise<boolean> {
  const vehicle = await Vehicle.findOne({
    plateNumber: plate.toUpperCase().trim(),
    organizationId: tenantId,
  }).select("_id").lean();
  return !!vehicle;
}

router.get("/", authorize("tyres", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await Tyre.find({ organizationId: organizationId(req) }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: records.length, data: records });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch tyres." });
  }
});

router.post("/", authorize("tyres", "create"), async (req: Request, res: Response): Promise<void> => {
  const parsed = TyreCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  const plate = parsed.data.vehiclePlate.toUpperCase().trim();
  try {
    if (!(await hasOwnedVehicle(plate, organizationId(req)))) {
      res.status(400).json({ success: false, message: "Vehicle plate must belong to your organization." });
      return;
    }
    const created = await Tyre.create({ ...parsed.data, vehiclePlate: plate, organizationId: organizationId(req) });
    res.status(201).json({ success: true, data: created });
  } catch {
    res.status(500).json({ success: false, message: "Failed to register tyre." });
  }
});

router.patch("/:id", authorize("tyres", "update"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Tyre not found." });
    return;
  }
  const parsed = TyreUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  const updates = { ...parsed.data };
  if (updates.vehiclePlate) {
    updates.vehiclePlate = updates.vehiclePlate.toUpperCase().trim();
  }
  try {
    if (updates.vehiclePlate && !(await hasOwnedVehicle(updates.vehiclePlate, organizationId(req)))) {
      res.status(400).json({ success: false, message: "Vehicle plate must belong to your organization." });
      return;
    }
    const updated = await Tyre.findOneAndUpdate(
      { _id: req.params.id, organizationId: organizationId(req) },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ success: false, message: "Tyre not found." });
      return;
    }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update tyre." });
  }
});

router.delete("/:id", authorize("tyres", "delete"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Tyre not found." });
    return;
  }
  try {
    const deleted = await Tyre.findOneAndDelete({
      _id: req.params.id,
      organizationId: organizationId(req),
    });
    if (!deleted) {
      res.status(404).json({ success: false, message: "Tyre not found." });
      return;
    }
    res.json({ success: true, message: "Tyre removed successfully." });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete tyre." });
  }
});

export const tyreRoutes = router;
