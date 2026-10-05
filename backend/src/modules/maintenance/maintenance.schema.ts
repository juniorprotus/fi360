import { z } from "zod";

export const MaintenanceTypeEnum = z.enum(["inspection", "oil_service", "brake_system", "tyre_rotation", "engine_overhaul", "electrical", "emergency_repair"]);
export const MaintenanceStatusEnum = z.enum(["scheduled", "in_progress", "completed", "cancelled"]);
export const PriorityEnum = z.enum(["low", "medium", "high", "urgent"]);

export const MaintenanceCreateSchema = z.object({
  vehicleId: z.string(),
  type: MaintenanceTypeEnum,
  status: MaintenanceStatusEnum.default("scheduled"),
  priority: PriorityEnum.default("medium"),
  description: z.string().min(5).max(500),
  cost: z.number().nonnegative().default(0),
  scheduledDate: z.string(),
  completedDate: z.string().optional(),
  odometerKmAtService: z.number().nonnegative().optional(),
  workshopNotes: z.string().optional(),
  aiPredictionRef: z.string().optional(),
});

export const MaintenanceUpdateSchema = MaintenanceCreateSchema.partial();

export type MaintenanceCreateInput = z.infer<typeof MaintenanceCreateSchema>;
export type MaintenanceUpdateInput = z.infer<typeof MaintenanceUpdateSchema>;
