import mongoose, { Schema, Types } from "mongoose";

export interface IOrganization {
  _id?: Types.ObjectId | string;
  name: string;
  slug: string;
  enabledModules: Array<"vehicles" | "drivers" | "maintenance" | "fuel" | "telematics" | "ai">;
  contactEmail?: string;
  phone?: string;
  address?: string;
  country?: string;
  fleetSize?: number;
  plan: "free" | "pro" | "enterprise";
  apiKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    enabledModules: {
      type: [String],
      enum: ["vehicles", "drivers", "maintenance", "fuel", "telematics", "ai"],
      default: ["vehicles", "drivers", "maintenance"],
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    country: { type: String, trim: true },
    fleetSize: { type: Number, min: 0 },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    apiKey: { type: String, select: false }, // Excluded from queries by default for security
  },
  {
    timestamps: true,
  }
);

// Index for fast module-aware queries (e.g., "which orgs have AI enabled?")
OrganizationSchema.index({ enabledModules: 1 });
OrganizationSchema.index({ plan: 1 });

export const Organization =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", OrganizationSchema);
