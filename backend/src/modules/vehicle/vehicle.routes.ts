import { Router, Request, Response } from "express";
import { VehicleService } from "./vehicle.service";
import { VehicleCreateSchema, VehicleUpdateSchema } from "./vehicle.schema";

const router = Router();

// GET /api/vehicles - List all vehicles
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await VehicleService.findAll();
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/vehicles/metrics - Fleet status metrics
router.get("/metrics", async (_req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await VehicleService.getStatusMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate vehicle metrics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/vehicles/:id - Get single vehicle
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await VehicleService.findById(req.params.id);
    if (!vehicle) {
      res.status(404).json({ success: false, message: "Vehicle not found" });
      return;
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve vehicle",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/vehicles - Create a vehicle with strict Zod validation
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parseResult = VehicleCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const created = await VehicleService.create(parseResult.data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create vehicle",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PATCH /api/vehicles/:id - Update vehicle
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const parseResult = VehicleUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const updated = await VehicleService.update(req.params.id, parseResult.data);
    if (!updated) {
      res.status(404).json({ success: false, message: "Vehicle not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const vehicleRoutes = router;
