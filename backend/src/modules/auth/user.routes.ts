import { Router, Request, Response } from "express";
import { z } from "zod";
import { User } from "./user.model";
import { authenticate, requireRole } from "./auth.middleware";
import { isDbConnected } from "../../config/db";

const router = Router();

// Zod Schema for inviting/creating organization team members
const CreateUserSchema = z.object({
  email: z.string().email("Valid email required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Temporary password must be at least 8 characters"),
  role: z.enum([
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
  ]),
});

/**
 * GET /api/users
 * List users in the caller's organization
 */
router.get(
  "/",
  authenticate,
  requireRole(["owner", "admin", "fleet_manager"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!isDbConnected()) {
        res.status(200).json({
          success: true,
          count: 0,
          data: [],
          message: "Database in offline fallback mode.",
        });
        return;
      }

      // Filter by caller's organization for multi-tenant isolation
      const query = req.user?.organizationId
        ? { organizationId: req.user.organizationId }
        : {};

      const users = await User.find(query)
        .select("-passwordResetToken -passwordResetExpires")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch organization users.",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * POST /api/users
 * Provision a new user within the caller's organization
 */
router.post(
  "/",
  authenticate,
  requireRole(["owner", "admin"]),
  async (req: Request, res: Response): Promise<void> => {
    const parseResult = CreateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || "Invalid input data.",
      });
      return;
    }

    const { email, name, password, role } = parseResult.data;

    // Privilege escalation prevention: only an 'owner' can create another 'owner'
    if (role === "owner" && req.user?.role !== "owner") {
      res.status(403).json({
        success: false,
        message: "Only organization owners can designate another user as owner.",
      });
      return;
    }

    try {
      if (!isDbConnected()) {
        res.status(503).json({
          success: false,
          message: "Database connection required to provision new accounts.",
        });
        return;
      }

      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        res.status(409).json({
          success: false,
          message: "A user with this email address is already registered.",
        });
        return;
      }

      const newUser = await User.create({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password,
        role,
        organizationId: req.user?.organizationId,
        organizationName: req.user?.organizationName,
        status: "active",
      });

      res.status(201).json({
        success: true,
        message: `Account for ${name} (${role}) successfully provisioned.`,
        data: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          organizationId: newUser.organizationId,
          status: newUser.status,
          createdAt: newUser.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create user account.",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * PATCH /api/users/:id/status
 * Update user status (e.g. suspend or reactivate)
 */
router.patch(
  "/:id/status",
  authenticate,
  requireRole(["owner", "admin"]),
  async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      res.status(400).json({ success: false, message: "Status must be 'active' or 'suspended'." });
      return;
    }

    try {
      if (!isDbConnected()) {
        res.status(503).json({ success: false, message: "Database connection required." });
        return;
      }

      // Ensure user belongs to the caller's organization
      const targetUser = await User.findOne({
        _id: req.params.id,
        organizationId: req.user?.organizationId,
      });

      if (!targetUser) {
        res.status(404).json({ success: false, message: "User not found in your organization." });
        return;
      }

      // Prevent deactivating own account
      if (targetUser._id.toString() === req.user?.userId) {
        res.status(400).json({ success: false, message: "You cannot suspend your own account." });
        return;
      }

      targetUser.status = status;
      await targetUser.save();

      res.status(200).json({
        success: true,
        message: `User account status updated to ${status}.`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update user status.",
      });
    }
  }
);

export const userRoutes = router;
