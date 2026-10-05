import { Router, Request, Response } from "express";
import { MaintenanceService } from "./maintenance.service";
import { MaintenanceCreateSchema, MaintenanceUpdateSchema } from "./maintenance.schema";

const router = Router();

// GET /api/maintenance - List all maintenance records
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.query;
    const records = vehicleId && typeof vehicleId === "string"
      ? await MaintenanceService.findByVehicleId(vehicleId)
      : await MaintenanceService.findAll();
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance records",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/maintenance - Create record
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const result = MaintenanceCreateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const created = await MaintenanceService.create(result.data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create maintenance record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PATCH /api/maintenance/:id - Update record
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const result = MaintenanceUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const updated = await MaintenanceService.update(req.params.id, result.data);
    if (!updated) {
      res.status(404).json({ success: false, message: "Maintenance record not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update maintenance record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const maintenanceRoutes = router;
