import { z } from "zod";

export const VehicleStatusEnum = z.enum(["active", "maintenance", "critical_failure", "inactive"]);
export type VehicleStatus = z.infer<typeof VehicleStatusEnum>;

export const VehicleTypeEnum = z.enum(["truck", "van", "pickup", "trailer", "forklift", "heavy_duty"]);
export type VehicleType = z.infer<typeof VehicleTypeEnum>;

export const TelematicsDataSchema = z.object({
  odometerKm: z.number().nonnegative().default(0),
  fuelLevelPercent: z.number().min(0).max(100).default(100),
  engineHours: z.number().nonnegative().default(0),
  batteryVoltage: z.number().positive().optional(),
  currentSpeedKmh: z.number().nonnegative().default(0),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }).optional(),
  lastPing: z.string().datetime().optional(),
});

export const VehicleCreateSchema = z.object({
  vin: z.string().min(5).max(30),
  plateNumber: z.string().min(2).max(20),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1970).max(2100),
  type: VehicleTypeEnum,
  status: VehicleStatusEnum.default("active"),
  organizationId: z.string().optional(),
  telematicsData: TelematicsDataSchema.partial().optional(),
});

export const VehicleUpdateSchema = VehicleCreateSchema.partial();

export const VehicleResponseSchema = VehicleCreateSchema.extend({
  id: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type VehicleCreateInput = z.infer<typeof VehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof VehicleUpdateSchema>;
export type VehicleResponse = z.infer<typeof VehicleResponseSchema>;
