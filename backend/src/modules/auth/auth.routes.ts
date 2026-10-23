import { Router, Request, Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { AuthService } from "./auth.service";
import { authenticate } from "./auth.middleware";

const router = Router();

// Rate limiter for authentication endpoints: 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts from this network. Please wait 15 minutes before trying again.",
  },
});

// Zod Schemas
const LoginSchema = z.object({
  email: z.string().email("Please provide a valid work email address"),
  password: z.string().min(1, "Password is required"),
});

const RegisterSchema = z.object({
  email: z.string().email("Please provide a valid business email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Full name must be at least 2 characters"),
  organizationName: z.string().min(2, "Company or organization name is required"),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

/**
 * Cookie options helper for secure sessions
 */
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
}

/**
 * POST /api/auth/login
 * Production authentication endpoint
 */
router.post("/login", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: parseResult.error.issues[0]?.message || "Invalid credentials provided.",
    });
    return;
  }

  const { email, password } = parseResult.data;

  try {
    const result = await AuthService.login(email, password);

    // Set secure HttpOnly cookie
    res.cookie("fi360_token", result.token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: "Authentication successful",
      token: result.token,
      user: result.user,
      redirectUrl: result.redirectUrl,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Authentication failed.",
    });
  }
});

/**
 * POST /api/auth/register
 * Self-service customer onboarding (creates organization + owner account)
 */
router.post("/register", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: parseResult.error.issues[0]?.message || "Invalid registration data.",
    });
    return;
  }

  try {
    const result = await AuthService.register(parseResult.data);
    res.cookie("fi360_token", result.token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: "Organization workspace successfully provisioned.",
      token: result.token,
      user: result.user,
      redirectUrl: result.redirectUrl,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Registration failed.",
    });
  }
});

/**
 * GET /api/auth/me
 * Session verification endpoint — rehydrates authenticated user profile on client refresh
 */
router.get("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const userProfile = await AuthService.getCurrentUser(req.user.userId);
    res.status(200).json({
      success: true,
      user: userProfile,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Session has expired or was revoked.",
    });
  }
});

/**
 * POST /api/auth/logout
 * Clears the HttpOnly cookie and invalidates client session
 */
router.post("/logout", (_req: Request, res: Response): void => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("fi360_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

/**
 * POST /api/auth/forgot-password
 * Initiates single-use expiring password reset token
 */
router.post("/forgot-password", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parseResult = ForgotPasswordSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
    return;
  }

  const result = await AuthService.requestPasswordReset(parseResult.data.email);
  res.status(200).json(result);
});

/**
 * POST /api/auth/reset-password
 * Verifies token and sets new password
 */
router.post("/reset-password", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parseResult = ResetPasswordSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: parseResult.error.issues[0]?.message || "Invalid input.",
    });
    return;
  }

  try {
    const result = await AuthService.resetPassword(
      parseResult.data.token,
      parseResult.data.newPassword
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Password reset failed.",
    });
  }
});

export const authRoutes = router;
