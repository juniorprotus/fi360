import { Router, Request, Response } from "express";
import { isDbConnected } from "../../config/db";
import { Driver, IDriver } from "./driver.model";
import { DriverService } from "./driver.service";
import { DriverCreateSchema, DriverUpdateSchema } from "./driver.schema";
import { Vehicle } from "../vehicle/vehicle.model";

const router = Router();

const getOrganizationId = (req: Request): string | undefined => req.user?.organizationId?.toString();

const filterDriversByOrg = (drivers: IDriver[], organizationId: string): IDriver[] =>
  drivers.filter((driver) => String(driver.organizationId ?? "000000000000000000000001") === organizationId);

// GET /api/drivers - List all drivers in the caller's organization
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to view drivers." });
    return;
  }

  try {
    if (isDbConnected()) {
      const drivers = await Driver.find({ organizationId }).sort({ fullName: 1 }).lean();
      res.json({ success: true, count: drivers.length, data: drivers });
      return;
    }

    const drivers = filterDriversByOrg(await DriverService.findAll(), organizationId);
    res.json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch drivers",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/drivers/:id - Single driver in the caller's organization
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to view this driver." });
    return;
  }

  try {
    if (isDbConnected()) {
      const driver = await Driver.findOne({ _id: req.params.id, organizationId }).lean();
      if (!driver) {
        res.status(404).json({ success: false, message: "Driver not found" });
        return;
      }
      res.json({ success: true, data: driver });
      return;
    }

    const driver = filterDriversByOrg(await DriverService.findAll(), organizationId).find(
      (item) => String(item._id) === req.params.id
    );
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

// POST /api/drivers - Create driver for the caller's organization
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to create drivers." });
    return;
  }

  const result = DriverCreateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  if (result.data.assignedVehicleId) {
    const vehicle = await Vehicle.findOne({ _id: result.data.assignedVehicleId, organizationId }).lean();
    if (!vehicle) {
      res.status(400).json({ success: false, message: "Assigned vehicle must belong to your organization." });
      return;
    }
  }

  try {
    const payload = {
      ...result.data,
      organizationId,
    };
    const created = await DriverService.create(payload as typeof result.data & { organizationId: string });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create driver",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PATCH /api/drivers/:id - Update driver within the caller's organization
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to update drivers." });
    return;
  }

  const result = DriverUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  if (result.data.assignedVehicleId) {
    const vehicle = await Vehicle.findOne({ _id: result.data.assignedVehicleId, organizationId }).lean();
    if (!vehicle) {
      res.status(400).json({ success: false, message: "Assigned vehicle must belong to your organization." });
      return;
    }
  }

  try {
    if (isDbConnected()) {
      const updated = await Driver.findOneAndUpdate(
        { _id: req.params.id, organizationId },
        { $set: result.data },
        { new: true }
      ).lean();
      if (!updated) {
        res.status(404).json({ success: false, message: "Driver not found" });
        return;
      }
      res.json({ success: true, data: updated });
      return;
    }

    const updated = await DriverService.update(req.params.id, result.data);
    const allowed = updated && String(updated.organizationId ?? "000000000000000000000001") === organizationId;
    if (!allowed) {
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
