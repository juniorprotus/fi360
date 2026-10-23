export type UserRole =
  | "owner"
  | "admin"
  | "fleet_manager"
  | "workshop_manager"
  | "technician"
  | "driver"
  | "dispatcher"
  | "compliance"
  | "finance"
  | "viewer";

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
  token: string;
  user: AuthUserPayload;
  redirectUrl: string;
}
