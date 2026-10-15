import { Router, Request, Response } from "express";
import { FuelLog } from "./fuel.model";
import { isDbConnected } from "../../config/db";

const router = Router();

// In-memory fallback
let inMemoryFuel = [
  {
    _id: "f_1",
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

// GET /api/fuel - List fuel logs
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      const docs = await FuelLog.find().sort({ createdAt: -1 }).lean();
      if (docs.length === 0) {
        const inserted = await FuelLog.insertMany(inMemoryFuel.map(({ _id, ...f }) => f));
        res.json({ success: true, count: inserted.length, data: inserted });
        return;
      }
      res.json({ success: true, count: docs.length, data: docs });
      return;
    }
    res.json({ success: true, count: inMemoryFuel.length, data: inMemoryFuel });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch fuel logs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/fuel - Log a fuel transaction
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { receiptNumber, vehiclePlate, litres, costTotal, odometerKm, station, date } = req.body;

  if (!receiptNumber || !vehiclePlate || !litres || !costTotal) {
    res.status(400).json({
      success: false,
      message: "Please provide receiptNumber, vehiclePlate, litres, and costTotal",
    });
    return;
  }

  const payload = {
    receiptNumber: String(receiptNumber).trim(),
    vehiclePlate: String(vehiclePlate).toUpperCase().trim(),
    litres: Number(litres),
    costTotal: Number(costTotal),
    odometerKm: Number(odometerKm) || 0,
    station: String(station || "Standard Depot Dispenser").trim(),
    date: date || new Date().toISOString().replace("T", " ").substring(0, 16),
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

// DELETE /api/fuel/:id - Delete fuel log
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const deleted = await FuelLog.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Fuel log not found" });
        return;
      }
      res.json({ success: true, message: "Fuel log deleted" });
      return;
    }

    const index = inMemoryFuel.findIndex((f) => String(f._id) === id);
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
