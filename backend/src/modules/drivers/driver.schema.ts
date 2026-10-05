import { z } from "zod";

export const DriverStatusEnum = z.enum(["active", "on_leave", "suspended", "off_duty"]);

export const DriverCreateSchema = z.object({
  fullName: z.string().min(2).max(100),
  licenseNumber: z.string().min(5).max(30),
  licenseClass: z.string().default("Heavy Commercial"),
  licenseExpiry: z.string(),
  phone: z.string().min(7).max(20),
  status: DriverStatusEnum.default("active"),
  performanceScore: z.number().min(0).max(100).default(90),
  assignedVehicleId: z.string().optional(),
});

export const DriverUpdateSchema = DriverCreateSchema.partial();

export type DriverCreateInput = z.infer<typeof DriverCreateSchema>;
export type DriverUpdateInput = z.infer<typeof DriverUpdateSchema>;
