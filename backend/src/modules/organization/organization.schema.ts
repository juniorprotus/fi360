import { z } from "zod";

export const ModuleEnum = z.enum([
  "vehicles",
  "drivers",
  "maintenance",
  "fuel",
  "telematics",
  "ai",
]);

export const OrganizationCreateSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or hyphens only"),
  enabledModules: z
    .array(ModuleEnum)
    .min(1)
    .default(["vehicles", "drivers", "maintenance"]),
  contactEmail: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  address: z.string().max(200).optional(),
  country: z.string().max(60).optional(),
  fleetSize: z.number().int().nonnegative().optional(),
  plan: z.enum(["free", "pro", "enterprise"]).default("free"),
});

export const OrganizationUpdateSchema = OrganizationCreateSchema.partial();

export type OrganizationCreateInput = z.infer<typeof OrganizationCreateSchema>;
export type OrganizationUpdateInput = z.infer<typeof OrganizationUpdateSchema>;
