import { Driver, IDriver } from "./driver.model";
import { DriverCreateInput, DriverUpdateInput } from "./driver.schema";
import { isDbConnected } from "../../config/db";

const inMemoryDrivers: IDriver[] = [
  {
    _id: "drv_mock_1",
    fullName: "Samuel Kiprop",
    licenseNumber: "DL-908122-A",
    licenseClass: "Class A Heavy Goods",
    licenseExpiry: new Date("2027-11-15"),
    phone: "+254 712 345 678",
    status: "active",
    performanceScore: 94,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "drv_mock_2",
    fullName: "Amina Noor",
    licenseNumber: "DL-455201-B",
    licenseClass: "Class B Articulated",
    licenseExpiry: new Date("2026-08-20"),
    phone: "+254 722 987 654",
    status: "active",
    performanceScore: 98,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class DriverService {
  public static async findAll(): Promise<IDriver[]> {
    if (isDbConnected()) {
      const docs = await Driver.find().sort({ fullName: 1 }).lean();
      return docs as unknown as IDriver[];
    }
    return inMemoryDrivers;
  }

  public static async findById(id: string): Promise<IDriver | null> {
    if (isDbConnected()) {
      const doc = await Driver.findById(id).lean();
      return doc as unknown as IDriver | null;
    }
    return inMemoryDrivers.find((d) => String(d._id) === id) || null;
  }

  public static async create(input: DriverCreateInput): Promise<IDriver> {
    if (isDbConnected()) {
      const doc = new Driver({
        ...input,
        licenseExpiry: new Date(input.licenseExpiry),
      });
      return doc.save() as unknown as Promise<IDriver>;
    }
    const newDoc: IDriver = {
      _id: `drv_mem_${Date.now()}`,
      fullName: input.fullName,
      licenseNumber: input.licenseNumber,
      licenseClass: input.licenseClass,
      licenseExpiry: new Date(input.licenseExpiry),
      phone: input.phone,
      status: input.status ?? "active",
      performanceScore: input.performanceScore ?? 90,
      assignedVehicleId: input.assignedVehicleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDrivers.push(newDoc);
    return newDoc;
  }

  public static async update(id: string, input: DriverUpdateInput): Promise<IDriver | null> {
    if (isDbConnected()) {
      const doc = await Driver.findByIdAndUpdate(id, { $set: input }, { new: true }).lean();
      return doc as unknown as IDriver | null;
    }
    const idx = inMemoryDrivers.findIndex((d) => String(d._id) === id);
    if (idx === -1) return null;
    const existing = inMemoryDrivers[idx];
    const updated: IDriver = {
      ...existing,
      ...input,
      licenseExpiry: input.licenseExpiry ? new Date(input.licenseExpiry) : existing.licenseExpiry,
      updatedAt: new Date(),
    };
    inMemoryDrivers[idx] = updated;
    return updated;
  }
}
