import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Driver, IDriver } from "./driver.model";
import { DriverCreateSchema, DriverUpdateSchema } from "./driver.schema";
import { IVehicle, Vehicle } from "../vehicle/vehicle.model";
import { User } from "../auth/user.model";
import { Inspection } from "../inspections/inspection.model";
import { authorize } from "../auth/authorization.middleware";
import { requireDatabase, requireOrganization } from "../auth/tenant.middleware";

const router = Router();
router.use(requireDatabase, requireOrganization);

const organizationId = (req: Request): string => req.user!.organizationId!;

async function validateLinkedUser(
  linkedUserId: string | null | undefined,
  orgId: string,
  driverId?: string
): Promise<boolean> {
  if (!linkedUserId) return true;
  if (!mongoose.isValidObjectId(linkedUserId)) return false;
  const user = await User.findOne({
    _id: linkedUserId,
    organizationId: orgId,
    role: "driver",
    status: "active",
  }).select("_id").lean();
  if (!user) return false;
  const existingLink = await Driver.findOne({
    linkedUserId,
    organizationId: orgId,
    ...(driverId ? { _id: { $ne: driverId } } : {}),
  }).select("_id").lean();
  return !existingLink;
}

const DriverInspectionSchema = z.object({
  reportNumber: z.string().trim().min(1).max(100).optional(),
  type: z.string().trim().min(1).max(100).default("Pre-Trip Walkaround"),
  outcome: z.enum(["passed", "failed", "requires_attention"]).default("passed"),
  defectsSummary: z.string().trim().max(1000).default("Zero critical defects noted."),
  date: z.string().min(1).max(40).optional(),
}).strict();

router.get("/me", async (req: Request, res: Response): Promise<void> => {
  if (req.user?.role !== "driver") {
    res.status(403).json({ success: false, message: "Driver portal access is restricted to driver accounts." });
    return;
  }
  try {
    const driver = await Driver.findOne({
      linkedUserId: req.user.userId,
      organizationId: organizationId(req),
      status: "active",
    }).lean<IDriver | null>();
    if (!driver) {
      res.status(404).json({ success: false, message: "No active driver profile is linked to this account." });
      return;
    }

    const vehicle = driver.assignedVehicleId
      ? await Vehicle.findOne({
          _id: driver.assignedVehicleId,
          organizationId: organizationId(req),
        })
          .select("plateNumber make model year type status telematicsData.odometerKm")
          .lean<IVehicle | null>()
      : null;
    res.json({
      success: true,
      data: {
        driver: {
          fullName: driver.fullName,
          licenseNumber: driver.licenseNumber,
          licenseClass: driver.licenseClass,
          licenseExpiry: driver.licenseExpiry,
          phone: driver.phone,
          status: driver.status,
        },
        vehicle: vehicle
          ? {
              plateNumber: vehicle.plateNumber,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              type: vehicle.type,
              status: vehicle.status,
              odometerKm: vehicle.telematicsData?.odometerKm ?? null,
            }
          : null,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch driver portal profile." });
  }
});

router.post("/me/inspections", async (req: Request, res: Response): Promise<void> => {
  if (req.user?.role !== "driver") {
    res.status(403).json({ success: false, message: "Driver portal access is restricted to driver accounts." });
    return;
  }
  try {
    const parsed = DriverInspectionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid inspection data.",
      });
      return;
    }
    const driver = await Driver.findOne({
      linkedUserId: req.user.userId,
      organizationId: organizationId(req),
      status: "active",
    }).select("assignedVehicleId").lean<Pick<IDriver, "assignedVehicleId"> | null>();
    if (!driver) {
      res.status(404).json({ success: false, message: "No active driver profile is linked to this account." });
      return;
    }
    if (!driver.assignedVehicleId) {
      res.status(409).json({ success: false, message: "No vehicle is assigned to this driver." });
      return;
    }
    const vehicle = await Vehicle.findOne({
      _id: driver.assignedVehicleId,
      organizationId: organizationId(req),
    }).select<Pick<IVehicle, "plateNumber">>("plateNumber").lean<Pick<IVehicle, "plateNumber"> | null>();
    if (!vehicle) {
      res.status(404).json({ success: false, message: "The assigned vehicle is unavailable." });
      return;
    }
    const inspection = await Inspection.create({
      ...parsed.data,
      reportNumber: parsed.data.reportNumber || `EDVIR-${Date.now()}`,
      vehiclePlate: vehicle.plateNumber,
      inspectorName: req.user.name,
      date: parsed.data.date || new Date().toISOString(),
      organizationId: organizationId(req),
    });
    res.status(201).json({ success: true, data: inspection });
  } catch {
    res.status(500).json({ success: false, message: "Failed to submit driver inspection." });
  }
});

router.get("/available-accounts", authorize("drivers", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const linked = await Driver.find({
      organizationId: organizationId(req),
      linkedUserId: { $exists: true },
    }).distinct("linkedUserId");
    const accounts = await User.find({
      organizationId: organizationId(req),
      role: "driver",
      status: "active",
      _id: { $nin: linked },
    }).select("_id name email").sort({ name: 1 }).lean<
      Array<{ _id: mongoose.Types.ObjectId; name: string; email: string }>
    >();
    res.json({
      success: true,
      data: accounts.map((account) => ({
        id: account._id.toString(),
        name: account.name,
        email: account.email,
      })),
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch available driver accounts." });
  }
});

router.get("/", authorize("drivers", "read"), async (req: Request, res: Response): Promise<void> => {
  try {
    const drivers = await Driver.find({ organizationId: organizationId(req) })
      .sort({ fullName: 1 })
      .lean<IDriver[]>();
    const vehicles = await Vehicle.find({
      _id: { $in: drivers.flatMap((driver) => driver.assignedVehicleId ? [driver.assignedVehicleId] : []) },
      organizationId: organizationId(req),
    }).select("_id plateNumber").lean<Array<{ _id: mongoose.Types.ObjectId; plateNumber: string }>>();
    const plateById = new Map(vehicles.map((vehicle) => [vehicle._id.toString(), vehicle.plateNumber]));
    res.json({
      success: true,
      count: drivers.length,
      data: drivers.map((driver) => ({
        ...driver,
        assignedVehicle: driver.assignedVehicleId
          ? plateById.get(driver.assignedVehicleId.toString())
          : undefined,
      })),
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch drivers." });
  }
});

router.get("/:id", authorize("drivers", "read"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Driver not found." });
    return;
  }
  try {
    const driver = await Driver.findOne({
      _id: req.params.id,
      organizationId: organizationId(req),
    }).lean();
    if (!driver) {
      res.status(404).json({ success: false, message: "Driver not found." });
      return;
    }
    res.json({ success: true, data: driver });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch driver." });
  }
});

router.post("/", authorize("drivers", "create"), async (req: Request, res: Response): Promise<void> => {
  const parsed = DriverCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    if (parsed.data.assignedVehicleId) {
      if (!mongoose.isValidObjectId(parsed.data.assignedVehicleId)) {
        res.status(400).json({ success: false, message: "Assigned vehicle ID is invalid." });
        return;
      }
      const vehicle = await Vehicle.findOne({
        _id: parsed.data.assignedVehicleId,
        organizationId: organizationId(req),
      }).select("_id").lean();
      if (!vehicle) {
        res.status(400).json({ success: false, message: "Assigned vehicle must belong to your organization." });
        return;
      }
    }
    if (!(await validateLinkedUser(parsed.data.linkedUserId, organizationId(req)))) {
      res.status(400).json({ success: false, message: "Linked account must be an active driver in your organization." });
      return;
    }
    const createData = { ...parsed.data };
    if (createData.linkedUserId === null) delete createData.linkedUserId;
    const created = await Driver.create({ ...createData, organizationId: organizationId(req) });
    res.status(201).json({ success: true, data: created });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create driver." });
  }
});

router.patch("/:id", authorize("drivers", "update"), async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Driver not found." });
    return;
  }
  const parsed = DriverUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    if (parsed.data.assignedVehicleId) {
      if (!mongoose.isValidObjectId(parsed.data.assignedVehicleId)) {
        res.status(400).json({ success: false, message: "Assigned vehicle ID is invalid." });
        return;
      }
      const vehicle = await Vehicle.findOne({
        _id: parsed.data.assignedVehicleId,
        organizationId: organizationId(req),
      }).select("_id").lean();
      if (!vehicle) {
        res.status(400).json({ success: false, message: "Assigned vehicle must belong to your organization." });
        return;
      }
    }
    if (!(await validateLinkedUser(parsed.data.linkedUserId, organizationId(req), req.params.id))) {
      res.status(400).json({ success: false, message: "Linked account must be an active driver in your organization." });
      return;
    }
    const update = { ...parsed.data };
    if (update.linkedUserId === null) delete update.linkedUserId;
    if (update.assignedVehicleId === null) delete update.assignedVehicleId;
    const updated = await Driver.findOneAndUpdate(
      { _id: req.params.id, organizationId: organizationId(req) },
      {
        $set: update,
        ...((parsed.data.linkedUserId === null || parsed.data.assignedVehicleId === null)
          ? {
              $unset: {
                ...(parsed.data.linkedUserId === null ? { linkedUserId: 1 } : {}),
                ...(parsed.data.assignedVehicleId === null ? { assignedVehicleId: 1 } : {}),
              },
            }
          : {}),
      },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ success: false, message: "Driver not found." });
      return;
    }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update driver." });
  }
});

export const driverRoutes = router;
