import mongoose, { Document, Schema } from "mongoose";

export interface ITyre extends Document {
  organizationId?: string;
  serialNumber: string;
  vehiclePlate: string;
  position: string;
  brand: string;
  treadDepthMm: number;
  pressurePsi: number;
  status: "good" | "warning" | "critical_wear";
  createdAt: Date;
  updatedAt: Date;
}

const TyreSchema = new Schema<ITyre>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    serialNumber: { type: String, required: true, trim: true },
    vehiclePlate: { type: String, required: true, uppercase: true, trim: true },
    position: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    treadDepthMm: { type: Number, required: true, min: 0 },
    pressurePsi: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["good", "warning", "critical_wear"],
      default: "good",
    },
  },
  { timestamps: true }
);

export const Tyre = mongoose.models.Tyre || mongoose.model<ITyre>("Tyre", TyreSchema);
