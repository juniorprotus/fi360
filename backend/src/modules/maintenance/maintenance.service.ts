import { MaintenanceLog, IMaintenanceLog } from "./maintenance.model";
import { MaintenanceCreateInput, MaintenanceUpdateInput } from "./maintenance.schema";
import { isDbConnected } from "../../config/db";

const inMemoryMaintenance: IMaintenanceLog[] = [
  {
    _id: "maint_mock_1",
    vehicleId: "veh_mock_2",
    type: "brake_system",
    status: "in_progress",
    priority: "high",
    description: "Brake pad replacement and hydraulic pressure calibration on axle 2",
    cost: 450,
    scheduledDate: new Date(),
    odometerKmAtService: 98120,
    workshopNotes: "Calipers inspected. Fluid flushed.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "maint_mock_2",
    vehicleId: "veh_mock_3",
    type: "emergency_repair",
    status: "scheduled",
    priority: "urgent",
    description: "Alternator malfunction and critical low battery voltage alert",
    cost: 320,
    scheduledDate: new Date(),
    odometerKmAtService: 28400,
    workshopNotes: "Towing arranged to nearest service hub.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class MaintenanceService {
  public static async findAll(): Promise<IMaintenanceLog[]> {
    if (isDbConnected()) {
      const docs = await MaintenanceLog.find().populate("vehicleId", "plateNumber make model").sort({ scheduledDate: -1 }).lean();
      return docs as unknown as IMaintenanceLog[];
    }
    return inMemoryMaintenance;
  }

  public static async findByVehicleId(vehicleId: string): Promise<IMaintenanceLog[]> {
    if (isDbConnected()) {
      const docs = await MaintenanceLog.find({ vehicleId }).sort({ scheduledDate: -1 }).lean();
      return docs as unknown as IMaintenanceLog[];
    }
    return inMemoryMaintenance.filter((m) => String(m.vehicleId) === vehicleId);
  }

  public static async create(input: MaintenanceCreateInput): Promise<IMaintenanceLog> {
    if (isDbConnected()) {
      const doc = new MaintenanceLog({
        ...input,
        scheduledDate: new Date(input.scheduledDate),
        completedDate: input.completedDate ? new Date(input.completedDate) : undefined,
      });
      return doc.save() as unknown as Promise<IMaintenanceLog>;
    }
    const newDoc: IMaintenanceLog = {
      _id: `maint_mem_${Date.now()}`,
      vehicleId: input.vehicleId,
      type: input.type,
      status: input.status ?? "scheduled",
      priority: input.priority ?? "medium",
      description: input.description,
      cost: input.cost ?? 0,
      scheduledDate: new Date(input.scheduledDate),
      completedDate: input.completedDate ? new Date(input.completedDate) : undefined,
      odometerKmAtService: input.odometerKmAtService,
      workshopNotes: input.workshopNotes,
      aiPredictionRef: input.aiPredictionRef,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryMaintenance.unshift(newDoc);
    return newDoc;
  }

  public static async update(id: string, input: MaintenanceUpdateInput): Promise<IMaintenanceLog | null> {
    if (isDbConnected()) {
      const doc = await MaintenanceLog.findByIdAndUpdate(id, { $set: input }, { new: true }).lean();
      return doc as unknown as IMaintenanceLog | null;
    }
    const idx = inMemoryMaintenance.findIndex((m) => String(m._id) === id);
    if (idx === -1) return null;
    const existing = inMemoryMaintenance[idx];
    const updated: IMaintenanceLog = {
      ...existing,
      ...input,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : existing.scheduledDate,
      completedDate: input.completedDate ? new Date(input.completedDate) : existing.completedDate,
      updatedAt: new Date(),
    };
    inMemoryMaintenance[idx] = updated;
    return updated;
  }
}
