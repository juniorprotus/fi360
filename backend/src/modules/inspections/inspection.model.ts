import mongoose, { Document, Schema } from "mongoose";

export interface IInspection extends Document {
  organizationId?: string;
  reportNumber: string;
  vehiclePlate: string;
  inspectorName: string;
  type: string;
  outcome: "passed" | "failed" | "requires_attention";
  defectsSummary: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

const InspectionSchema = new Schema<IInspection>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    reportNumber: { type: String, required: true, trim: true },
    vehiclePlate: { type: String, required: true, uppercase: true, trim: true },
    inspectorName: { type: String, required: true, trim: true },
    type: { type: String, required: true, default: "pre_trip" },
    outcome: {
      type: String,
      enum: ["passed", "failed", "requires_attention"],
      default: "passed",
    },
    defectsSummary: { type: String, default: "Zero critical defects noted" },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

export const Inspection =
  mongoose.models.Inspection || mongoose.model<IInspection>("Inspection", InspectionSchema);
