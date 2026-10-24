import { Router, Request, Response } from "express";
import { FuelLog } from "./fuel.model";
import { isDbConnected } from "../../config/db";
import { Vehicle } from "../vehicle/vehicle.model";

const router = Router();

const getOrganizationId = (req: Request): string | undefined => req.user?.organizationId?.toString();

// In-memory fallback
let inMemoryFuel = [
  {
    _id: "f_1",
    organizationId: "000000000000000000000001",
    receiptNumber: "TX-FUEL-8819",
    vehiclePlate: "KBZ-482L",
    litres: 280,
    costTotal: 392.0,
    odometerKm: 48250,
    station: "TotalEnergies Mtito Andei Highway",
    date: "2026-10-06 14:20",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "f_2",
    organizationId: "000000000000000000000001",
    receiptNumber: "TX-FUEL-8820",
    vehiclePlate: "KCE-771P",
    litres: 340,
    costTotal: 476.0,
    odometerKm: 112400,
    station: "Rubis Nakuru Bypass",
    date: "2026-10-06 18:05",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// GET /api/fuel - List fuel logs in caller's organization
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to view fuel logs." });
    return;
  }

  try {
    if (isDbConnected()) {
      const docs = await FuelLog.find({ organizationId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, count: docs.length, data: docs });
      return;
    }
    const records = inMemoryFuel.filter((f) => String(f.organizationId ?? "000000000000000000000001") === organizationId);
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch fuel logs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/fuel - Log a fuel transaction for caller's organization
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to create fuel logs." });
    return;
  }

  const { receiptNumber, vehiclePlate, litres, costTotal, odometerKm, station, date } = req.body;

  if (!receiptNumber || !vehiclePlate || !litres || !costTotal) {
    res.status(400).json({
      success: false,
      message: "Please provide receiptNumber, vehiclePlate, litres, and costTotal",
    });
    return;
  }

  const normalizedPlate = String(vehiclePlate).toUpperCase().trim();
  const vehicle = await Vehicle.findOne({ plateNumber: normalizedPlate, organizationId }).lean();
  if (!vehicle) {
    res.status(400).json({ success: false, message: "Vehicle plate must belong to your organization." });
    return;
  }

  const payload = {
    receiptNumber: String(receiptNumber).trim(),
    vehiclePlate: normalizedPlate,
    litres: Number(litres),
    costTotal: Number(costTotal),
    odometerKm: Number(odometerKm) || 0,
    station: String(station || "Standard Depot Dispenser").trim(),
    date: date || new Date().toISOString().replace("T", " ").substring(0, 16),
    organizationId,
  };

  try {
    if (isDbConnected()) {
      const created = await FuelLog.create(payload);
      res.status(201).json({ success: true, data: created });
      return;
    }

    const created = {
      _id: `f_${Date.now()}`,
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryFuel.unshift(created as any);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create fuel log",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE /api/fuel/:id - Delete fuel log from caller's organization only
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to delete fuel logs." });
    return;
  }

  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const deleted = await FuelLog.findOneAndDelete({ _id: id, organizationId });
      if (!deleted) {
        res.status(404).json({ success: false, message: "Fuel log not found" });
        return;
      }
      res.json({ success: true, message: "Fuel log deleted" });
      return;
    }

    const index = inMemoryFuel.findIndex(
      (f) => String(f._id) === id && String(f.organizationId ?? "000000000000000000000001") === organizationId
    );
    if (index === -1) {
      res.status(404).json({ success: false, message: "Fuel log not found" });
      return;
    }
    inMemoryFuel.splice(index, 1);
    res.json({ success: true, message: "Fuel log deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete fuel log",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const fuelRoutes = router;
