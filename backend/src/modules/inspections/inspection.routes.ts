import { Router, Request, Response } from "express";
import { z } from "zod";
import { Inspection } from "./inspection.model";
import { Vehicle } from "../vehicle/vehicle.model";
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

const organizationId = (req: Request): string => req.user!.organizationId!;

router.get("/", authorize("inspections", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await Inspection.find({ organizationId: organizationId(req) }).sort({ createdAt: -1 }).lean();
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
      reportNumber: parsed.data.reportNumber || `EDVIR-${Math.floor(1000 + Math.random() * 9000)}`,
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

export const inspectionRoutes = router;
