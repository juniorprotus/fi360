import mongoose, { Document, Schema } from "mongoose";

export type InspectionOutcome =
  | "passed"
  | "passed_with_defects"
  | "failed"
  | "requires_attention";
export type InspectionType = "pre_trip" | "post_trip" | "routine" | "incident";
export type DefectSeverity = "minor" | "major" | "critical";
export type DefectStatus = "open" | "work_order_created" | "awaiting_verification" | "resolved";

export interface InspectionDefect {
  _id?: mongoose.Types.ObjectId;
  itemId: string;
  category: string;
  description: string;
  severity: DefectSeverity;
  status: DefectStatus;
  reportedAt: Date;
  workOrderId?: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  history: Array<{
    status: DefectStatus;
    changedBy: mongoose.Types.ObjectId;
    actorName: string;
    changedAt: Date;
    workOrderId?: mongoose.Types.ObjectId;
    note: string;
  }>;
}

export interface InspectionChecklistResponse {
  itemId: string;
  result: "pass" | "fail" | "not_applicable";
  description?: string;
  severity?: "minor" | "major";
}

export interface InspectionDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  reportNumber: string;
  vehiclePlate: string;
  vehicleId?: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  inspectorName: string;
  type: InspectionType | string;
  outcome: InspectionOutcome;
  defectsSummary: string;
  date: string;
  odometerKm?: number;
  checklist: InspectionChecklistResponse[];
  defects: InspectionDefect[];
  clientSubmissionId?: string;
  submissionHash?: string;
  submittedAt?: Date;
  driverAttested?: boolean;
  attestedBy?: mongoose.Types.ObjectId;
  attestedAt?: Date;
  reviewHistory: Array<{
    reviewerId: mongoose.Types.ObjectId;
    reviewerName: string;
    reviewedAt: Date;
    notes: string;
    safetyDecision: "available" | "restricted" | "out_of_service";
    reviewedOutcome: InspectionOutcome;
    defectUpdates: Array<{ defectId: string; status: DefectStatus }>;
  }>;
  reviewedOutcome?: InspectionOutcome;
}

const ChecklistResponseSchema = new Schema<InspectionChecklistResponse>(
  {
    itemId: { type: String, required: true },
    result: { type: String, enum: ["pass", "fail", "not_applicable"], required: true },
    description: { type: String, maxlength: 1000 },
    severity: { type: String, enum: ["minor", "major"] },
  },
  { _id: false }
);

const DefectSchema = new Schema<InspectionDefect>(
  {
    itemId: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true, maxlength: 1000 },
    severity: { type: String, enum: ["minor", "major", "critical"], required: true },
    status: {
      type: String,
      enum: ["open", "work_order_created", "awaiting_verification", "resolved"],
      default: "open",
      required: true,
    },
    reportedAt: { type: Date, required: true },
    workOrderId: { type: Schema.Types.ObjectId, ref: "MaintenanceLog" },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    history: [{
      status: {
        type: String,
        enum: ["open", "work_order_created", "awaiting_verification", "resolved"],
        required: true,
      },
      changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      actorName: { type: String, required: true, maxlength: 100 },
      changedAt: { type: Date, required: true },
      workOrderId: { type: Schema.Types.ObjectId, ref: "MaintenanceLog" },
      note: { type: String, maxlength: 1000, default: "" },
    }],
  },
  { _id: true }
);

const ReviewHistorySchema = new Schema(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewerName: { type: String, required: true, maxlength: 100 },
    reviewedAt: { type: Date, required: true },
    notes: { type: String, maxlength: 1000, default: "" },
    safetyDecision: {
      type: String,
      enum: ["available", "restricted", "out_of_service"],
      required: true,
    },
    reviewedOutcome: {
      type: String,
      enum: ["passed", "passed_with_defects", "failed", "requires_attention"],
      required: true,
    },
    defectUpdates: [{
      defectId: { type: String, required: true },
      status: {
        type: String,
        enum: ["open", "work_order_created", "awaiting_verification", "resolved"],
        required: true,
      },
    }],
  },
  { _id: false }
);

const InspectionSchema = new Schema<InspectionDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    reportNumber: { type: String, required: true },
    vehiclePlate: { type: String, required: true, trim: true, uppercase: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver" },
    inspectorName: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    outcome: {
      type: String,
      enum: ["passed", "passed_with_defects", "failed", "requires_attention"],
      required: true,
    },
    reviewedOutcome: {
      type: String,
      enum: ["passed", "passed_with_defects", "failed", "requires_attention"],
    },
    defectsSummary: { type: String, default: "" },
    date: { type: String, required: true },
    odometerKm: { type: Number, min: 0 },
    checklist: { type: [ChecklistResponseSchema], default: [] },
    defects: { type: [DefectSchema], default: [] },
    clientSubmissionId: { type: String },
    submissionHash: { type: String, minlength: 64, maxlength: 64 },
    submittedAt: { type: Date },
    driverAttested: { type: Boolean, default: false },
    attestedBy: { type: Schema.Types.ObjectId, ref: "User" },
    attestedAt: { type: Date },
    reviewHistory: { type: [ReviewHistorySchema], default: [] },
  },
  { timestamps: true }
);

InspectionSchema.index(
  { organizationId: 1, clientSubmissionId: 1 },
  { unique: true, partialFilterExpression: { clientSubmissionId: { $type: "string" } } }
);
InspectionSchema.index({ organizationId: 1, vehicleId: 1, submittedAt: -1 });
InspectionSchema.index({ organizationId: 1, driverId: 1, submittedAt: -1 });

export const Inspection: mongoose.Model<InspectionDocument> =
  (mongoose.models.Inspection as mongoose.Model<InspectionDocument> | undefined) ||
  mongoose.model<InspectionDocument>("Inspection", InspectionSchema);
