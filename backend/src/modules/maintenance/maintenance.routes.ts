import { Router, Request, Response } from "express";
import { isDbConnected } from "../../config/db";
import { MaintenanceLog } from "./maintenance.model";
import { MaintenanceService } from "./maintenance.service";
import { MaintenanceCreateSchema, MaintenanceUpdateSchema } from "./maintenance.schema";
import { Vehicle } from "../vehicle/vehicle.model";

const router = Router();

const getOrganizationId = (req: Request): string | undefined => req.user?.organizationId?.toString();

// GET /api/maintenance - List maintenance records in caller's organization
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to view maintenance records." });
    return;
  }

  try {
    const { vehicleId } = req.query;
    if (isDbConnected()) {
      const query: Record<string, unknown> = { organizationId };
      if (vehicleId && typeof vehicleId === "string") query.vehicleId = vehicleId;
      const records = await MaintenanceLog.find(query).sort({ scheduledDate: -1 }).lean();
      res.json({ success: true, count: records.length, data: records });
      return;
    }

    const records = (await MaintenanceService.findAll()).filter(
      (item) => String(item.organizationId ?? "000000000000000000000001") === organizationId
    );
    const filtered = vehicleId && typeof vehicleId === "string"
      ? records.filter((item) => String(item.vehicleId) === vehicleId)
      : records;
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance records",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/maintenance - Create record scoped to caller's organization
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to create maintenance records." });
    return;
  }

  const result = MaintenanceCreateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  const vehicle = await Vehicle.findOne({ _id: result.data.vehicleId, organizationId }).lean();
  if (!vehicle) {
    res.status(400).json({ success: false, message: "Vehicle must belong to your organization." });
    return;
  }

  try {
    const created = await MaintenanceService.create({
      ...result.data,
      organizationId,
    } as typeof result.data & { organizationId: string });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create maintenance record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PATCH /api/maintenance/:id - Update record within the caller's organization
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to update maintenance records." });
    return;
  }

  const result = MaintenanceUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  if (result.data.vehicleId) {
    const vehicle = await Vehicle.findOne({ _id: result.data.vehicleId, organizationId }).lean();
    if (!vehicle) {
      res.status(400).json({ success: false, message: "Vehicle must belong to your organization." });
      return;
    }
  }

  try {
    if (isDbConnected()) {
      const existing = await MaintenanceLog.findOne({ _id: req.params.id, organizationId }).lean();
      if (!existing) {
        res.status(404).json({ success: false, message: "Maintenance record not found" });
        return;
      }
      const updated = await MaintenanceLog.findOneAndUpdate(
        { _id: req.params.id, organizationId },
        { $set: result.data },
        { new: true }
      ).lean();
      res.json({ success: true, data: updated });
      return;
    }

    const updated = await MaintenanceService.update(req.params.id, result.data);
    if (!updated || String(updated.organizationId ?? "000000000000000000000001") !== organizationId) {
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
