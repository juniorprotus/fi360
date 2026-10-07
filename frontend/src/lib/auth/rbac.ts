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

export interface RoleConfig {
  role: UserRole;
  label: string;
  defaultRoute: string;
  allowedNavHrefs: string[];
  description: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  owner: {
    role: "owner",
    label: "Organization Owner",
    defaultRoute: "/dashboard",
    allowedNavHrefs: [
      "/dashboard",
      "/dashboard/fleet",
      "/dashboard/drivers",
      "/dashboard/workshop",
      "/dashboard/inspections",
      "/dashboard/tyres",
      "/dashboard/fuel",
      "/dashboard/transport",
      "/dashboard/costs",
      "/dashboard/telematics",
      "/dashboard/analytics",
      "/dashboard/admin",
      "/dashboard/interop",
      "/dashboard/settings",
    ],
    description: "Full access to all 13 modules, organization settings, billing and multi-tenant security.",
  },
  admin: {
    role: "admin",
    label: "System Administrator",
    defaultRoute: "/dashboard",
    allowedNavHrefs: [
      "/dashboard",
      "/dashboard/fleet",
      "/dashboard/drivers",
      "/dashboard/workshop",
      "/dashboard/inspections",
      "/dashboard/tyres",
      "/dashboard/fuel",
      "/dashboard/transport",
      "/dashboard/costs",
      "/dashboard/telematics",
      "/dashboard/analytics",
      "/dashboard/admin",
      "/dashboard/interop",
      "/dashboard/settings",
    ],
    description: "System-wide administration, user management, and security configurations.",
  },
  fleet_manager: {
    role: "fleet_manager",
    label: "Fleet Operations Manager",
    defaultRoute: "/dashboard/fleet",
    allowedNavHrefs: [
      "/dashboard",
      "/dashboard/fleet",
      "/dashboard/drivers",
      "/dashboard/workshop",
      "/dashboard/inspections",
      "/dashboard/tyres",
      "/dashboard/fuel",
      "/dashboard/transport",
      "/dashboard/analytics",
    ],
    description: "Vehicle lifecycle control, driver allocation, and operational fleet readiness.",
  },
  workshop_manager: {
    role: "workshop_manager",
    label: "Workshop & Maintenance Lead",
    defaultRoute: "/dashboard/workshop",
    allowedNavHrefs: [
      "/dashboard",
      "/dashboard/workshop",
      "/dashboard/fleet",
      "/dashboard/inspections",
      "/dashboard/tyres",
      "/dashboard/analytics",
    ],
    description: "Repair orders, PM schedules, technician job cards, and spare parts management.",
  },
  technician: {
    role: "technician",
    label: "Workshop Technician",
    defaultRoute: "/dashboard/workshop",
    allowedNavHrefs: [
      "/dashboard/workshop",
      "/dashboard/fleet",
      "/dashboard/inspections",
      "/dashboard/tyres",
    ],
    description: "Assigned repair tasks, diagnostic inspection checklists, and parts consumption.",
  },
  driver: {
    role: "driver",
    label: "Fleet Driver / Operator",
    defaultRoute: "/dashboard/driver",
    allowedNavHrefs: [
      "/dashboard/driver",
      "/dashboard/inspections",
      "/dashboard/fuel",
    ],
    description: "Vehicle assignment, digital pre-trip eDVIR walkaround, and logbook entries.",
  },
  dispatcher: {
    role: "dispatcher",
    label: "Transport & Dispatch Specialist",
    defaultRoute: "/dashboard/transport",
    allowedNavHrefs: [
      "/dashboard",
      "/dashboard/transport",
      "/dashboard/fleet",
      "/dashboard/drivers",
      "/dashboard/telematics",
    ],
    description: "Real-time dispatch, route monitoring, trip assignments, and vehicle telematics.",
  },
  compliance: {
    role: "compliance",
    label: "Safety & Compliance Officer",
    defaultRoute: "/dashboard/inspections",
    allowedNavHrefs: [
      "/dashboard",
      "/dashboard/inspections",
      "/dashboard/drivers",
      "/dashboard/fleet",
      "/dashboard/analytics",
    ],
    description: "eDVIR defect audits, MOT/safety certifications, and driver license expiration.",
  },
  finance: {
    role: "finance",
    label: "Finance & Cost Controller",
    defaultRoute: "/dashboard/costs",
    allowedNavHrefs: [
      "/dashboard",
      "/dashboard/costs",
      "/dashboard/fuel",
      "/dashboard/tyres",
      "/dashboard/analytics",
    ],
    description: "Total Cost of Ownership (TCO), fuel expenses, maintenance invoices, and cost-per-km.",
  },
  viewer: {
    role: "viewer",
    label: "Executive Viewer (Read-Only)",
    defaultRoute: "/dashboard",
    allowedNavHrefs: [
      "/dashboard",
      "/dashboard/fleet",
      "/dashboard/analytics",
    ],
    description: "Read-only access to executive KPI cards, fleet analytics, and high-level reports.",
  },
};

export function getDefaultRouteForRole(role: UserRole): string {
  return ROLE_CONFIGS[role]?.defaultRoute || "/dashboard";
}

export function isRouteAllowedForRole(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_CONFIGS[role]?.allowedNavHrefs || [];
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}
