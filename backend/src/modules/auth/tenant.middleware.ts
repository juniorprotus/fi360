import { NextFunction, Request, Response } from "express";
import { isDbConnected } from "../../config/db";

export function requireDatabase(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isDbConnected()) {
    res.status(503).json({
      success: false,
      message: "Database service is unavailable.",
    });
    return;
  }
  next();
}

export function requireOrganization(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.organizationId) {
    res.status(403).json({
      success: false,
      message: "Organization membership is required.",
    });
    return;
  }
  next();
}
