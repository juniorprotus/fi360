import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Trip } from "./trip.model";
import { Vehicle } from "../vehicle/vehicle.model";
import { Driver } from "../drivers/driver.model";
import { authorize } from "../auth/authorization.middleware";
import { requireDatabase, requireOrganization } from "../auth/tenant.middleware";

const router = Router();
router.use(requireDatabase, requireOrganization);

const TripCreateSchema = z.object({
  tripNumber: z.string().trim().min(1).max(100).optional(),
  vehiclePlate: z.string().trim().min(2).max(20),
  assignedDriver: z.string().trim().min(1).max(100),
  origin: z.string().trim().min(1).max(200),
  destination: z.string().trim().min(1).max(200),
  cargoDescription: z.string().trim().min(1).max(500).default("General Cargo"),
  eta: z.string().trim().min(1).max(100).default("Scheduled"),
  status: z.enum(["dispatched", "in_transit", "delivered", "delayed"]).default("dispatched"),
}).strict();

const TripUpdateSchema = z.object({
  tripNumber: z.string().trim().min(1).max(100).optional(),
  vehiclePlate: z.string().trim().min(2).max(20).optional(),
  assignedDriver: z.string().trim().min(1).max(100).optional(),
  origin: z.string().trim().min(1).max(200).optional(),
  destination: z.string().trim().min(1).max(200).optional(),
  cargoDescription: z.string().trim().min(1).max(500).optional(),
  eta: z.string().trim().min(1).max(100).optional(),
  status: z.enum(["dispatched", "in_transit", "delivered", "delayed"]).optional(),
}).strict();

const organizationId = (req: Request): string => req.user!.organizationId!;

async function referencesBelongToOrganization(
  vehiclePlate: string,
  assignedDriver: string,
  tenantId: string
): Promise<boolean> {
  const normalizedPlate = vehiclePlate.toUpperCase().trim();
  const normalizedDriver = assignedDriver.trim();
  const [vehicle, driver] = await Promise.all([
    Vehicle.findOne({ plateNumber: normalizedPlate, organizationId: tenantId }).select("_id").lean(),
    Driver.findOne({ fullName: normalizedDriver, organizationId: tenantId }).select("_id").lean(),
  ]);
  return !!vehicle && !!driver;
}

router.get("/", authorize("transport", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await Trip.find({ organizationId: organizationId(req) }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: records.length, data: records });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch dispatch trips." });
  }
});

router.post("/", authorize("transport", "create"), async (req: Request, res: Response): Promise<void> => {
  const parsed = TripCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  const plate = parsed.data.vehiclePlate.toUpperCase().trim();
  try {
    if (!(await referencesBelongToOrganization(plate, parsed.data.assignedDriver, organizationId(req)))) {
      res.status(400).json({ success: false, message: "Assigned vehicle and driver must belong to your organization." });
      return;
    }
    const created = await Trip.create({
      ...parsed.data,
      tripNumber: parsed.data.tripNumber || `TRIP-${Math.floor(100 + Math.random() * 900)}`,
      vehiclePlate: plate,
      organizationId: organizationId(req),
    });
    res.status(201).json({ success: true, data: created });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create trip." });
  }
});

router.patch("/:id", authorize("transport", "update"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Trip not found." });
    return;
  }
  const parsed = TripUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const existing = await Trip.findOne({
      _id: req.params.id,
      organizationId: organizationId(req),
    }).lean();
    if (!existing) {
      res.status(404).json({ success: false, message: "Trip not found." });
      return;
    }

    const vehiclePlate = parsed.data.vehiclePlate ?? existing.vehiclePlate;
    const assignedDriver = parsed.data.assignedDriver ?? existing.assignedDriver;
    if (!(await referencesBelongToOrganization(vehiclePlate, assignedDriver, organizationId(req)))) {
      res.status(400).json({ success: false, message: "Assigned vehicle and driver must belong to your organization." });
      return;
    }
    const updates = {
      ...parsed.data,
      ...(parsed.data.vehiclePlate ? { vehiclePlate: parsed.data.vehiclePlate.toUpperCase().trim() } : {}),
    };
    const updated = await Trip.findOneAndUpdate(
      { _id: req.params.id, organizationId: organizationId(req) },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ success: false, message: "Trip not found." });
      return;
    }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update trip." });
  }
});

export const transportRoutes = router;
