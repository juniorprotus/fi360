import { z } from "zod";

export const PredictiveMaintenanceRequestSchema = z.object({
  vehicleId: z.string().optional(),
  telematicsData: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    odometerKm: z.number(),
    engineHours: z.number(),
    batteryVoltage: z.number().optional(),
    recentFaultCodes: z.array(z.string()).optional(),
  }),
});

export type PredictiveMaintenanceRequest = z.infer<typeof PredictiveMaintenanceRequestSchema>;
