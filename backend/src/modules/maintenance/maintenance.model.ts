import mongoose, { Schema, Types } from "mongoose";

export interface IMaintenanceLog {
  _id?: Types.ObjectId | string;
  vehicleId: Types.ObjectId | string;
  type: "inspection" | "oil_service" | "brake_system" | "tyre_rotation" | "engine_overhaul" | "electrical" | "emergency_repair";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  description: string;
  cost: number;
  scheduledDate: Date;
  completedDate?: Date;
  odometerKmAtService?: number;
  workshopNotes?: string;
  aiPredictionRef?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MaintenanceLogSchema = new Schema<IMaintenanceLog>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["inspection", "oil_service", "brake_system", "tyre_rotation", "engine_overhaul", "electrical", "emergency_repair"],
    },
    status: {
      type: String,
      required: true,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    description: { type: String, required: true },
    cost: { type: Number, default: 0 },
    scheduledDate: { type: Date, required: true },
    completedDate: { type: Date },
    odometerKmAtService: { type: Number },
    workshopNotes: { type: String },
    aiPredictionRef: { type: String },
  },
  { timestamps: true }
);

export const MaintenanceLog = mongoose.models.MaintenanceLog || mongoose.model<IMaintenanceLog>("MaintenanceLog", MaintenanceLogSchema);
