import { Router, Request, Response } from "express";
import { Trip } from "./trip.model";
import { isDbConnected } from "../../config/db";

const router = Router();

let inMemoryTrips = [
  {
    _id: "trip_1",
    tripNumber: "TRIP-NBO-MBA-102",
    vehiclePlate: "KBZ-482L",
    assignedDriver: "John Maina",
    origin: "Nairobi Inland Container Depot",
    destination: "Mombasa Port Kilindini",
    cargoDescription: "Consolidated Export Tea (28 MT)",
    eta: "Today, 22:00",
    status: "in_transit",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "trip_2",
    tripNumber: "TRIP-NBO-KSM-304",
    vehiclePlate: "KCE-771P",
    assignedDriver: "Samuel Karanja",
    origin: "Athi River Steel Mill",
    destination: "Kisumu Lakeside Hub",
    cargoDescription: "Rebar & Structural Steel",
    eta: "Tomorrow, 08:30",
    status: "dispatched",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// GET /api/transport - List all trips
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      const docs = await Trip.find().sort({ createdAt: -1 }).lean();
      if (docs.length === 0) {
        const inserted = await Trip.insertMany(inMemoryTrips.map(({ _id, ...t }) => t));
        res.json({ success: true, count: inserted.length, data: inserted });
        return;
      }
      res.json({ success: true, count: docs.length, data: docs });
      return;
    }
    res.json({ success: true, count: inMemoryTrips.length, data: inMemoryTrips });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dispatch trips",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/transport - Create trip
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { tripNumber, vehiclePlate, assignedDriver, origin, destination, cargoDescription, eta, status } = req.body;

  if (!vehiclePlate || !assignedDriver || !origin || !destination) {
    res.status(400).json({
      success: false,
      message: "Please provide vehiclePlate, assignedDriver, origin, and destination",
    });
    return;
  }

  const payload = {
    tripNumber: tripNumber || `TRIP-${Math.floor(100 + Math.random() * 900)}`,
    vehiclePlate: String(vehiclePlate).toUpperCase().trim(),
    assignedDriver: String(assignedDriver).trim(),
    origin: String(origin).trim(),
    destination: String(destination).trim(),
    cargoDescription: String(cargoDescription || "General Cargo").trim(),
    eta: String(eta || "Scheduled").trim(),
    status: status || "dispatched",
  };

  try {
    if (isDbConnected()) {
      const created = await Trip.create(payload);
      res.status(201).json({ success: true, data: created });
      return;
    }

    const created = {
      _id: `trip_${Date.now()}`,
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryTrips.unshift(created as any);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create trip",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PATCH /api/transport/:id - Update status
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (isDbConnected()) {
      const updated = await Trip.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!updated) {
        res.status(404).json({ success: false, message: "Trip not found" });
        return;
      }
      res.json({ success: true, data: updated });
      return;
    }

    const index = inMemoryTrips.findIndex((t) => String(t._id) === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: "Trip not found" });
      return;
    }
    const merged = { ...inMemoryTrips[index], ...updates, updatedAt: new Date() };
    inMemoryTrips[index] = merged as any;
    res.json({ success: true, data: merged });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update trip",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const transportRoutes = router;
