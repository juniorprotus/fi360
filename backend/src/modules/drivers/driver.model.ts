import mongoose, { Schema, Types } from "mongoose";

export interface IDriver {
  _id?: Types.ObjectId | string;
  fullName: string;
  licenseNumber: string;
  licenseClass: string;
  licenseExpiry: Date;
  phone: string;
  status: "active" | "on_leave" | "suspended" | "off_duty";
  performanceScore: number;
  assignedVehicleId?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    fullName: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    licenseClass: { type: String, default: "Heavy Commercial" },
    licenseExpiry: { type: Date, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "on_leave", "suspended", "off_duty"],
      default: "active",
      index: true,
    },
    performanceScore: { type: Number, default: 90, min: 0, max: 100 },
    assignedVehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" },
  },
  { timestamps: true }
);

export const Driver = mongoose.models.Driver || mongoose.model<IDriver>("Driver", DriverSchema);
