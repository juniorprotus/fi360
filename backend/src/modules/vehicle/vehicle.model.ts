import mongoose, { Schema, Types } from "mongoose";

export interface IVehicle {
  _id?: Types.ObjectId | string;
  vin: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: "active" | "maintenance" | "critical_failure" | "inactive";
  organizationId?: Types.ObjectId | string;
  telematicsData: {
    odometerKm: number;
    fuelLevelPercent: number;
    engineHours: number;
    batteryVoltage?: number;
    currentSpeedKmh: number;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    lastPing?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    vin: { type: String, required: true, unique: true, uppercase: true, trim: true },
    plateNumber: { type: String, required: true, uppercase: true, trim: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: ["truck", "van", "pickup", "trailer", "forklift", "heavy_duty"],
      default: "truck",
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "maintenance", "critical_failure", "inactive"],
      default: "active",
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    telematicsData: {
      odometerKm: { type: Number, default: 0 },
      fuelLevelPercent: { type: Number, default: 100 },
      engineHours: { type: Number, default: 0 },
      batteryVoltage: { type: Number },
      currentSpeedKmh: { type: Number, default: 0 },
      location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String },
      },
      lastPing: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

export const Vehicle = mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);
