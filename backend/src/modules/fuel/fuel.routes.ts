import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { FuelLog } from "./fuel.model";
import { Vehicle } from "../vehicle/vehicle.model";
import { authorize } from "../auth/authorization.middleware";
import { requireDatabase, requireOrganization } from "../auth/tenant.middleware";

const router = Router();
router.use(requireDatabase, requireOrganization);

const FuelCreateSchema = z.object({
  receiptNumber: z.string().trim().min(1).max(100),
  vehiclePlate: z.string().trim().min(2).max(20),
  litres: z.number().positive(),
  costTotal: z.number().nonnegative(),
  odometerKm: z.number().nonnegative().default(0),
  station: z.string().trim().min(1).max(150).default("Standard Depot Dispenser"),
  date: z.string().min(1).max(40).optional(),
}).strict();

const organizationId = (req: Request): string => req.user!.organizationId!;

router.get("/", authorize("fuel", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await FuelLog.find({ organizationId: organizationId(req) }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: records.length, data: records });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch fuel logs." });
  }
});

router.post("/", authorize("fuel", "create"), async (req: Request, res: Response): Promise<void> => {
  const parsed = FuelCreateSchema.safeParse(req.body);
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
    const created = await FuelLog.create({
      ...parsed.data,
      vehiclePlate: plate,
      date: parsed.data.date || new Date().toISOString().replace("T", " ").substring(0, 16),
      organizationId: organizationId(req),
    });
    res.status(201).json({ success: true, data: created });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create fuel log." });
  }
});

router.delete("/:id", authorize("fuel", "delete"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Fuel log not found." });
    return;
  }
  try {
    const deleted = await FuelLog.findOneAndDelete({
      _id: req.params.id,
      organizationId: organizationId(req),
    });
    if (!deleted) {
      res.status(404).json({ success: false, message: "Fuel log not found." });
      return;
    }
    res.json({ success: true, message: "Fuel log deleted." });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete fuel log." });
  }
});

export const fuelRoutes = router;
