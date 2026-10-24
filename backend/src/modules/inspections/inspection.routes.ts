import { Router, Request, Response } from "express";
import { Inspection } from "./inspection.model";
import { isDbConnected } from "../../config/db";
import { Vehicle } from "../vehicle/vehicle.model";

const router = Router();

const getOrganizationId = (req: Request): string | undefined => req.user?.organizationId?.toString();

let inMemoryInspections = [
  {
    _id: "insp_1",
    organizationId: "000000000000000000000001",
    reportNumber: "EDVIR-9041",
    vehiclePlate: "KBZ-482L",
    inspectorName: "John Maina (Driver)",
    type: "Pre-Trip Walkaround",
    outcome: "passed",
    defectsSummary: "Zero critical defects noted. Tyres & pneumatics verified.",
    date: "2026-10-06 06:30",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "insp_2",
    organizationId: "000000000000000000000001",
    reportNumber: "EDVIR-9042",
    vehiclePlate: "KDD-109X",
    inspectorName: "Peter Ochieng (Mechanic)",
    type: "Workshop Audit",
    outcome: "requires_attention",
    defectsSummary: "Brake pad wear nearing 3mm minimum safety threshold.",
    date: "2026-10-06 09:15",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "insp_3",
    organizationId: "000000000000000000000001",
    reportNumber: "EDVIR-9043",
    vehiclePlate: "KDA-553M",
    inspectorName: "Samuel Karanja (Safety Officer)",
    type: "Annual MOT Compliance",
    outcome: "failed",
    defectsSummary: "Alternator low output; battery drained below critical 11.2V.",
    date: "2026-10-05 16:45",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// GET /api/inspections - List inspections in caller's organization
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to view inspections." });
    return;
  }

  try {
    if (isDbConnected()) {
      const docs = await Inspection.find({ organizationId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, count: docs.length, data: docs });
      return;
    }
    const records = inMemoryInspections.filter(
      (item) => String(item.organizationId ?? "000000000000000000000001") === organizationId
    );
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch inspections",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/inspections - Create inspection scoped to caller's organization
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership required to record inspections." });
    return;
  }

  const { reportNumber, vehiclePlate, inspectorName, type, outcome, defectsSummary, date } = req.body;

  if (!vehiclePlate || !inspectorName) {
    res.status(400).json({
      success: false,
      message: "Please provide vehiclePlate and inspectorName",
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
    reportNumber: reportNumber || `EDVIR-${Math.floor(1000 + Math.random() * 9000)}`,
    vehiclePlate: normalizedPlate,
    inspectorName: String(inspectorName).trim(),
    type: type || "Pre-Trip Walkaround",
    outcome: outcome || "passed",
    defectsSummary: defectsSummary || "Zero critical defects noted.",
    date: date || new Date().toISOString().replace("T", " ").substring(0, 16),
    organizationId,
  };

  try {
    if (isDbConnected()) {
      const created = await Inspection.create(payload);
      res.status(201).json({ success: true, data: created });
      return;
    }

    const created = {
      _id: `insp_${Date.now()}`,
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryInspections.unshift(created as any);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to record inspection",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const inspectionRoutes = router;
