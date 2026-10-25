import { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const DEVELOPMENT_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function getTrustedOrigins(): Set<string> {
  const origins = new Set<string>();
  const configuredOrigin = process.env.FRONTEND_URL;

  if (configuredOrigin) {
    try {
      const parsed = new URL(configuredOrigin);
      if (parsed.origin === configuredOrigin && parsed.protocol === "https:") {
        origins.add(configuredOrigin);
      } else if (process.env.NODE_ENV !== "production" && parsed.origin === configuredOrigin) {
        origins.add(configuredOrigin);
      }
    } catch {
      // Invalid configured origins are not trusted.
    }
  }

  if (process.env.NODE_ENV !== "production") {
    for (const origin of DEVELOPMENT_ORIGINS) origins.add(origin);
  }

  return origins;
}

export function isTrustedOrigin(origin: string | undefined): boolean {
  return !!origin && getTrustedOrigins().has(origin);
}

export function protectStateChangingRequests(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const isAuthMutation = req.path.startsWith("/api/auth/");
  const usesCookieSession = !!req.cookies?.fi360_token;
  if (!isAuthMutation && !usesCookieSession) {
    next();
    return;
  }

  if (
    !isTrustedOrigin(req.get("origin")) ||
    req.get("x-fi360-request") !== "1"
  ) {
    res.status(403).json({ success: false, message: "Trusted origin and CSRF request header are required." });
    return;
  }

  next();
}
