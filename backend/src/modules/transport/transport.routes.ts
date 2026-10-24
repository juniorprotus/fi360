import { Router, Request, Response } from "express";
import { Trip } from "./trip.model";
import { isDbConnected } from "../../config/db";
import { Vehicle } from "../vehicle/vehicle.model";
import { Driver } from "../drivers/driver.model";

const router = Router();

const getOrganizationId = (req: Request): string | undefined => req.user?.organizationId?.toString();

let inMemoryTrips = [
  {
    _id: "trip_1",
    organizationId: "000000000000000000000001",
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
    organizationId: "000000000000000000000001",
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

// GET /api/transport - List trips in caller's organization
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to view dispatch trips." });
    return;
  }

  try {
    if (isDbConnected()) {
      const docs = await Trip.find({ organizationId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, count: docs.length, data: docs });
      return;
    }
    const records = inMemoryTrips.filter(
      (trip) => String(trip.organizationId ?? "000000000000000000000001") === organizationId
    );
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dispatch trips",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/transport - Create trip scoped to caller's organization
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to create dispatch trips." });
    return;
  }

  const { tripNumber, vehiclePlate, assignedDriver, origin, destination, cargoDescription, eta, status } = req.body;

  if (!vehiclePlate || !assignedDriver || !origin || !destination) {
    res.status(400).json({
      success: false,
      message: "Please provide vehiclePlate, assignedDriver, origin, and destination",
    });
    return;
  }

  const normalizedPlate = String(vehiclePlate).toUpperCase().trim();
  const vehicle = await Vehicle.findOne({ plateNumber: normalizedPlate, organizationId }).lean();
  if (!vehicle) {
    res.status(400).json({ success: false, message: "Vehicle plate must belong to your organization." });
    return;
  }

  const driver = await Driver.findOne({ fullName: String(assignedDriver).trim(), organizationId }).lean();
  if (!driver) {
    res.status(400).json({ success: false, message: "Assigned driver must belong to your organization." });
    return;
  }

  const payload = {
    tripNumber: tripNumber || `TRIP-${Math.floor(100 + Math.random() * 900)}`,
    vehiclePlate: normalizedPlate,
    assignedDriver: String(assignedDriver).trim(),
    origin: String(origin).trim(),
    destination: String(destination).trim(),
    cargoDescription: String(cargoDescription || "General Cargo").trim(),
    eta: String(eta || "Scheduled").trim(),
    status: status || "dispatched",
    organizationId,
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

// PATCH /api/transport/:id - Update trip within the caller's organization
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to update dispatch trips." });
    return;
  }

  const { id } = req.params;
  const updates = req.body;

  if (updates.vehiclePlate) {
    const normalizedPlate = String(updates.vehiclePlate).toUpperCase().trim();
    const vehicle = await Vehicle.findOne({ plateNumber: normalizedPlate, organizationId }).lean();
    if (!vehicle) {
      res.status(400).json({ success: false, message: "Vehicle plate must belong to your organization." });
      return;
    }
  }

  if (updates.assignedDriver) {
    const driver = await Driver.findOne({ fullName: String(updates.assignedDriver).trim(), organizationId }).lean();
    if (!driver) {
      res.status(400).json({ success: false, message: "Assigned driver must belong to your organization." });
      return;
    }
  }

  try {
    if (isDbConnected()) {
      const updated = await Trip.findOneAndUpdate({ _id: id, organizationId }, { $set: updates }, { new: true }).lean();
      if (!updated) {
        res.status(404).json({ success: false, message: "Trip not found" });
        return;
      }
      res.json({ success: true, data: updated });
      return;
    }

    const index = inMemoryTrips.findIndex(
      (trip) => String(trip._id) === id && String(trip.organizationId ?? "000000000000000000000001") === organizationId
    );
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
