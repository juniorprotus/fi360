import { Router, Request, Response } from "express";
import { DriverService } from "./driver.service";
import { DriverCreateSchema, DriverUpdateSchema } from "./driver.schema";

const router = Router();

// GET /api/drivers - List all drivers
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const drivers = await DriverService.findAll();
    res.json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch drivers",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/drivers/:id - Single driver
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const driver = await DriverService.findById(req.params.id);
    if (!driver) {
      res.status(404).json({ success: false, message: "Driver not found" });
      return;
    }
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch driver",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/drivers - Create driver
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const result = DriverCreateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const created = await DriverService.create(result.data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create driver",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PATCH /api/drivers/:id - Update driver
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const result = DriverUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const updated = await DriverService.update(req.params.id, result.data);
    if (!updated) {
      res.status(404).json({ success: false, message: "Driver not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update driver",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const driverRoutes = router;
