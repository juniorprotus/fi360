import { Router, Request, Response } from "express";
import { isDbConnected } from "../../config/db";
import { Vehicle } from "./vehicle.model";
import { VehicleService } from "./vehicle.service";
import { VehicleCreateSchema, VehicleUpdateSchema } from "./vehicle.schema";

const router = Router();

const getOrganizationId = (req: Request): string | undefined => req.user?.organizationId?.toString();

// GET /api/vehicles - List vehicles in the caller's organization
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to view vehicles." });
    return;
  }

  try {
    if (isDbConnected()) {
      const vehicles = await Vehicle.find({ organizationId }).sort({ updatedAt: -1 }).lean();
      res.json({ success: true, count: vehicles.length, data: vehicles });
      return;
    }

    const vehicles = (await VehicleService.findAll()).filter(
      (vehicle) => String(vehicle.organizationId ?? "000000000000000000000001") === organizationId
    );
    res.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/vehicles/metrics - Fleet status metrics for caller's organization
router.get("/metrics", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to view fleet metrics." });
    return;
  }

  try {
    const vehicles = isDbConnected()
      ? await Vehicle.find({ organizationId }).lean()
      : (await VehicleService.findAll()).filter(
          (vehicle) => String(vehicle.organizationId ?? "000000000000000000000001") === organizationId
        );

    const metrics: Record<string, number> = {
      active: 0,
      maintenance: 0,
      critical_failure: 0,
      inactive: 0,
    };

    for (const curr of vehicles) {
      const key = String(curr.status ?? "inactive");
      metrics[key] = (metrics[key] ?? 0) + 1;
    }

    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate vehicle metrics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/vehicles/:id - Get single vehicle in caller's organization
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to view this vehicle." });
    return;
  }

  try {
    if (isDbConnected()) {
      const vehicle = await Vehicle.findOne({ _id: req.params.id, organizationId }).lean();
      if (!vehicle) {
        res.status(404).json({ success: false, message: "Vehicle not found" });
        return;
      }
      res.json({ success: true, data: vehicle });
      return;
    }

    const vehicle = (await VehicleService.findAll()).find(
      (item) => String(item._id) === req.params.id && String(item.organizationId ?? "000000000000000000000001") === organizationId
    );
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

// POST /api/vehicles - Create a vehicle for the caller's organization
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to create vehicles." });
    return;
  }

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
    const payload = {
      ...parseResult.data,
      organizationId,
    };
    const created = await VehicleService.create(payload as typeof parseResult.data & { organizationId: string });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create vehicle",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PATCH /api/vehicles/:id - Update a vehicle within the caller's organization
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to update vehicles." });
    return;
  }

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
    if (isDbConnected()) {
      const updated = await Vehicle.findOneAndUpdate(
        { _id: req.params.id, organizationId },
        { $set: parseResult.data },
        { new: true }
      ).lean();
      if (!updated) {
        res.status(404).json({ success: false, message: "Vehicle not found" });
        return;
      }
      res.json({ success: true, data: updated });
      return;
    }

    const existing = (await VehicleService.findAll()).find(
      (item) => String(item._id) === req.params.id && String(item.organizationId ?? "000000000000000000000001") === organizationId
    );
    if (!existing) {
      res.status(404).json({ success: false, message: "Vehicle not found" });
      return;
    }

    const updated = await VehicleService.update(req.params.id, parseResult.data as any);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE /api/vehicles/:id - Delete vehicle from caller's organization only
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to delete vehicles." });
    return;
  }

  try {
    if (isDbConnected()) {
      const deleted = await Vehicle.findOneAndDelete({ _id: req.params.id, organizationId });
      if (!deleted) {
        res.status(404).json({ success: false, message: "Vehicle not found" });
        return;
      }
      res.json({ success: true, message: "Vehicle deleted successfully" });
      return;
    }

    const deleted = await VehicleService.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: "Vehicle not found" });
      return;
    }
    res.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const vehicleRoutes = router;
