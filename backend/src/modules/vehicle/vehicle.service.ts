import { Vehicle, IVehicle } from "./vehicle.model";
import { VehicleCreateInput, VehicleUpdateInput } from "./vehicle.schema";
import { isDbConnected } from "../../config/db";

// In-memory fallback dataset for seamless zero-cloud or local test execution without MongoDB
const inMemoryVehicles: IVehicle[] = [
  {
    _id: "veh_mock_1",
    vin: "1HD1KAE11FB012345",
    plateNumber: "KBZ-482L",
    make: "Mercedes-Benz",
    model: "Actros 2645",
    year: 2023,
    type: "truck",
    status: "active",
    telematicsData: {
      odometerKm: 48250,
      fuelLevelPercent: 78,
      engineHours: 1240,
      batteryVoltage: 24.2,
      currentSpeedKmh: 68,
      location: { latitude: -1.286389, longitude: 36.817223, address: "Mombasa Corridor, Mile 45" },
      lastPing: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "veh_mock_2",
    vin: "2T2HZ4EE8KC098765",
    plateNumber: "KDD-109X",
    make: "Isuzu",
    model: "FRR 90",
    year: 2022,
    type: "truck",
    status: "maintenance",
    telematicsData: {
      odometerKm: 98120,
      fuelLevelPercent: 32,
      engineHours: 3410,
      batteryVoltage: 23.4,
      currentSpeedKmh: 0,
      location: { latitude: -1.3197, longitude: 36.8522, address: "Central Workshop - Bay 3" },
      lastPing: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "veh_mock_3",
    vin: "3FA6P0H78HR123987",
    plateNumber: "KDA-553M",
    make: "Toyota",
    model: "Hilux D-4D",
    year: 2024,
    type: "pickup",
    status: "critical_failure",
    telematicsData: {
      odometerKm: 28400,
      fuelLevelPercent: 12,
      engineHours: 620,
      batteryVoltage: 11.2,
      currentSpeedKmh: 0,
      location: { latitude: -0.023559, longitude: 37.906193, address: "Northern Route - Checkpoint Bravo" },
      lastPing: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class VehicleService {
  /**
   * Internal API contract: Find all vehicles
   */
  public static async findAll(): Promise<IVehicle[]> {
    if (isDbConnected()) {
      const docs = await Vehicle.find().sort({ updatedAt: -1 }).lean();
      return docs as unknown as IVehicle[];
    }
    return inMemoryVehicles;
  }

  /**
   * Internal API contract: Find vehicle by ID
   */
  public static async findById(id: string): Promise<IVehicle | null> {
    if (isDbConnected()) {
      const doc = await Vehicle.findById(id).lean();
      return doc as unknown as IVehicle | null;
    }
    return inMemoryVehicles.find((v) => String(v._id) === id) || null;
  }

  /**
   * Internal API contract: Create vehicle
   */
  public static async create(input: VehicleCreateInput): Promise<IVehicle> {
    if (isDbConnected()) {
      const doc = new Vehicle(input);
      return doc.save() as unknown as Promise<IVehicle>;
    }
    const newVeh: IVehicle = {
      _id: `veh_mem_${Date.now()}`,
      vin: input.vin,
      plateNumber: input.plateNumber,
      make: input.make,
      model: input.model,
      year: input.year,
      type: input.type,
      status: input.status ?? "active",
      organizationId: input.organizationId,
      telematicsData: {
        odometerKm: input.telematicsData?.odometerKm ?? 0,
        fuelLevelPercent: input.telematicsData?.fuelLevelPercent ?? 100,
        engineHours: input.telematicsData?.engineHours ?? 0,
        batteryVoltage: input.telematicsData?.batteryVoltage ?? 24.0,
        currentSpeedKmh: input.telematicsData?.currentSpeedKmh ?? 0,
        location: input.telematicsData?.location,
        lastPing: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryVehicles.unshift(newVeh);
    return newVeh;
  }

  /**
   * Internal API contract: Update vehicle
   */
  public static async update(id: string, input: VehicleUpdateInput): Promise<IVehicle | null> {
    if (isDbConnected()) {
      const doc = await Vehicle.findByIdAndUpdate(id, { $set: input }, { new: true }).lean();
      return doc as unknown as IVehicle | null;
    }
    const index = inMemoryVehicles.findIndex((v) => String(v._id) === id);
    if (index === -1) return null;
    const existing = inMemoryVehicles[index];
    const updated: IVehicle = {
      ...existing,
      ...input,
      telematicsData: {
        ...existing.telematicsData,
        ...input.telematicsData,
        lastPing: input.telematicsData?.lastPing
          ? new Date(input.telematicsData.lastPing)
          : existing.telematicsData.lastPing,
      },
      updatedAt: new Date(),
    };
    inMemoryVehicles[index] = updated;
    return updated;
  }

  /**
   * Internal API contract: Delete vehicle
   */
  public static async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      const result = await Vehicle.findByIdAndDelete(id);
      return !!result;
    }
    const index = inMemoryVehicles.findIndex((v) => String(v._id) === id);
    if (index === -1) return false;
    inMemoryVehicles.splice(index, 1);
    return true;
  }

  /**
   * Internal API contract: Count vehicles by status
   */
  public static async getStatusMetrics(): Promise<Record<string, number>> {
    const list = await this.findAll();
    return list.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, { active: 0, maintenance: 0, critical_failure: 0, inactive: 0 });
  }
}
