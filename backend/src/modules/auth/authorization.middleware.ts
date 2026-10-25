import { Request, Response, NextFunction } from "express";
import { UserRole } from "./auth.types";

export type Resource = "vehicles" | "drivers" | "maintenance" | "tyres" | "fuel" | "inspections" | "transport" | "ai";
export type Action = "read" | "create" | "update" | "delete";

type Permission = `${Resource}:${Action}`;

const ALL_PERMISSIONS: Permission[] = [
  "vehicles:read", "vehicles:create", "vehicles:update", "vehicles:delete",
  "drivers:read", "drivers:create", "drivers:update", "drivers:delete",
  "maintenance:read", "maintenance:create", "maintenance:update", "maintenance:delete",
  "tyres:read", "tyres:create", "tyres:update", "tyres:delete",
  "fuel:read", "fuel:create", "fuel:update", "fuel:delete",
  "inspections:read", "inspections:create", "inspections:update", "inspections:delete",
  "transport:read", "transport:create", "transport:update", "transport:delete",
  "ai:read", "ai:create",
];

const READ_ONLY_OPERATIONS: Permission[] = [
  "vehicles:read", "drivers:read", "maintenance:read", "tyres:read",
  "fuel:read", "inspections:read", "transport:read", "ai:read",
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  fleet_manager: ALL_PERMISSIONS,
  workshop_manager: [
    "vehicles:read", "drivers:read",
    "maintenance:read", "maintenance:create", "maintenance:update", "maintenance:delete",
    "tyres:read", "tyres:create", "tyres:update", "tyres:delete",
    "inspections:read", "inspections:create",
  ],
  technician: [
    "vehicles:read", "maintenance:read", "maintenance:update",
    "tyres:read", "inspections:read", "inspections:create",
  ],
  driver: [],
  dispatcher: [
    "vehicles:read", "drivers:read",
    "transport:read", "transport:create", "transport:update",
  ],
  compliance: [
    "vehicles:read", "drivers:read", "maintenance:read",
    "inspections:read", "inspections:create", "inspections:update",
  ],
  finance: [
    "vehicles:read", "maintenance:read", "tyres:read", "fuel:read", "fuel:create",
  ],
  viewer: READ_ONLY_OPERATIONS.filter((permission) => permission === "vehicles:read"),
};

export function authorize(resource: Resource, action: Action) {
  const permission = `${resource}:${action}` as Permission;

  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role || !ROLE_PERMISSIONS[role]?.includes(permission)) {
      res.status(403).json({ success: false, message: "You are not authorized to perform this operation." });
      return;
    }
    next();
  };
}
