import mongoose, { Document, Schema } from "mongoose";

export interface IFuelLog extends Document {
  organizationId?: string;
  receiptNumber: string;
  vehiclePlate: string;
  litres: number;
  costTotal: number;
  odometerKm: number;
  station: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

const FuelLogSchema = new Schema<IFuelLog>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    receiptNumber: { type: String, required: true, trim: true },
    vehiclePlate: { type: String, required: true, uppercase: true, trim: true },
    litres: { type: Number, required: true, min: 0 },
    costTotal: { type: Number, required: true, min: 0 },
    odometerKm: { type: Number, required: true, min: 0 },
    station: { type: String, required: true, trim: true },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

export const FuelLog = mongoose.models.FuelLog || mongoose.model<IFuelLog>("FuelLog", FuelLogSchema);
