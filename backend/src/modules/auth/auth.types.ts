export const USER_ROLES = [
  "owner",
  "admin",
  "fleet_manager",
  "workshop_manager",
  "technician",
  "driver",
  "dispatcher",
  "compliance",
  "finance",
  "viewer",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "invited", "suspended"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_MANAGEABLE_STATUSES = ["active", "suspended"] as const;

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  plan?: "Starter" | "Professional" | "Enterprise";
}

export interface LoginResponse {
  success: boolean;
  user: AuthUserPayload;
  redirectUrl: string;
}
