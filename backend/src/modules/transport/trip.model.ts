import mongoose, { Document, Schema } from "mongoose";

export interface ITrip extends Document {
  organizationId?: string;
  tripNumber: string;
  vehiclePlate: string;
  assignedDriver: string;
  origin: string;
  destination: string;
  cargoDescription: string;
  eta: string;
  status: "dispatched" | "in_transit" | "delivered" | "delayed";
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    tripNumber: { type: String, required: true, trim: true },
    vehiclePlate: { type: String, required: true, uppercase: true, trim: true },
    assignedDriver: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    cargoDescription: { type: String, required: true, trim: true },
    eta: { type: String, required: true },
    status: {
      type: String,
      enum: ["dispatched", "in_transit", "delivered", "delayed"],
      default: "dispatched",
    },
  },
  { timestamps: true }
);

export const Trip: mongoose.Model<ITrip> = mongoose.models.Trip
  ? mongoose.model<ITrip>("Trip")
  : mongoose.model<ITrip>("Trip", TripSchema);
