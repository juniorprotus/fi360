import { Request, Response, NextFunction } from "express";
import {
  AuthDatabaseUnavailableError,
  AuthService,
  InvalidUserSessionError,
} from "./auth.service";
import { AuthUserPayload, UserRole, VerifiedAuthToken } from "./auth.types";

// Augment Express Request interface with authenticated user property
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * Extracts JWT token from Authorization header or HttpOnly cookie
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies.fi360_token) {
    return req.cookies.fi360_token;
  }
  return null;
}

/**
 * Enforces valid authentication on protected routes.
 * Returns HTTP 401 if token is absent, expired, forged, or invalid.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void | Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please provide a valid Bearer token.",
    });
    return;
  }

  let payload: VerifiedAuthToken;
  try {
    payload = AuthService.verifyToken(token);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please sign in again.",
    });
    return;
  }

  return AuthService.getCurrentUser(payload.userId, payload.jti)
    .then((currentUser) => {
      req.user = currentUser;
      next();
    })
    .catch((error: unknown) => {
      if (error instanceof InvalidUserSessionError) {
        res.status(401).json({
          success: false,
          message: "Session expired, invalid, or no longer active. Please sign in again.",
        });
        return;
      }
      if (error instanceof AuthDatabaseUnavailableError) {
        res.status(503).json({
          success: false,
          message: "Authentication service is temporarily unavailable.",
        });
        return;
      }
      next(error);
    });
}

/**
 * Enforces Role-Based Access Control (RBAC).
 * Returns HTTP 403 if the authenticated user's role is not in the allowed roles list.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required before permission verification.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this action.`,
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware:
 * Attaches user to request if a valid token is provided, but continues without error if not.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = AuthService.verifyToken(token);
    } catch {
      // Ignored for optional routes
    }
  }
  next();
}
