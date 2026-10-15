import { Router, Request, Response } from "express";
import { Tyre } from "./tyre.model";
import { isDbConnected } from "../../config/db";

const router = Router();

// In-memory fallback
let inMemoryTyres = [
  {
    _id: "tyre_1",
    serialNumber: "TY-MIC-9921",
    vehiclePlate: "KBZ-482L",
    position: "Steer Axle - Front Left",
    brand: "Michelin X Multiway 315/80R22.5",
    treadDepthMm: 12.5,
    pressurePsi: 120,
    status: "good",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "tyre_2",
    serialNumber: "TY-MIC-9922",
    vehiclePlate: "KBZ-482L",
    position: "Steer Axle - Front Right",
    brand: "Michelin X Multiway 315/80R22.5",
    treadDepthMm: 11.8,
    pressurePsi: 118,
    status: "good",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "tyre_3",
    serialNumber: "TY-BRI-8401",
    vehiclePlate: "KDD-109X",
    position: "Drive Axle - Rear Outer Right",
    brand: "Bridgestone M729",
    treadDepthMm: 3.2,
    pressurePsi: 95,
    status: "warning",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// GET /api/tyres - List all tyres
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      const docs = await Tyre.find().sort({ createdAt: -1 }).lean();
      if (docs.length === 0) {
        // Seed default tyres if empty
        const inserted = await Tyre.insertMany(inMemoryTyres.map(({ _id, ...t }) => t));
        res.json({ success: true, count: inserted.length, data: inserted });
        return;
      }
      res.json({ success: true, count: docs.length, data: docs });
      return;
    }
    res.json({ success: true, count: inMemoryTyres.length, data: inMemoryTyres });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tyres",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/tyres - Register a new tyre
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { serialNumber, vehiclePlate, position, brand, treadDepthMm, pressurePsi, status } = req.body;

  if (!serialNumber || !vehiclePlate || !position || !brand) {
    res.status(400).json({
      success: false,
      message: "Please provide serialNumber, vehiclePlate, position, and brand",
    });
    return;
  }

  const payload = {
    serialNumber: String(serialNumber).trim(),
    vehiclePlate: String(vehiclePlate).toUpperCase().trim(),
    position: String(position).trim(),
    brand: String(brand).trim(),
    treadDepthMm: Number(treadDepthMm) || 12.0,
    pressurePsi: Number(pressurePsi) || 110,
    status: status || "good",
  };

  try {
    if (isDbConnected()) {
      const created = await Tyre.create(payload);
      res.status(201).json({ success: true, data: created });
      return;
    }

    const created = {
      _id: `tyre_${Date.now()}`,
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryTyres.unshift(created as any);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to register tyre",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PATCH /api/tyres/:id - Update tyre
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (isDbConnected()) {
      const updated = await Tyre.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!updated) {
        res.status(404).json({ success: false, message: "Tyre not found" });
        return;
      }
      res.json({ success: true, data: updated });
      return;
    }

    const index = inMemoryTyres.findIndex((t) => String(t._id) === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: "Tyre not found" });
      return;
    }
    const merged = { ...inMemoryTyres[index], ...updates, updatedAt: new Date() };
    inMemoryTyres[index] = merged as any;
    res.json({ success: true, data: merged });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update tyre",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE /api/tyres/:id - Remove tyre
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const deleted = await Tyre.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Tyre not found" });
        return;
      }
      res.json({ success: true, message: "Tyre removed successfully" });
      return;
    }

    const index = inMemoryTyres.findIndex((t) => String(t._id) === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: "Tyre not found" });
      return;
    }
    inMemoryTyres.splice(index, 1);
    res.json({ success: true, message: "Tyre removed successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete tyre",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const tyreRoutes = router;
