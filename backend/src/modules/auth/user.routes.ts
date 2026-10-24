import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User, IUser } from "./user.model";
import { authenticate } from "./auth.middleware";
import { USER_MANAGEABLE_STATUSES, USER_ROLES, UserRole } from "./auth.types";
import { isDbConnected } from "../../config/db";

const router = Router();
const MAX_BCRYPT_PASSWORD_BYTES = 72;

const CreateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email("Valid email required")
      .transform((email) => email.toLowerCase()),
    password: z
      .string()
      .min(8)
      .refine(
        (password) => Buffer.byteLength(password, "utf8") <= MAX_BCRYPT_PASSWORD_BYTES,
        `Password must not exceed ${MAX_BCRYPT_PASSWORD_BYTES} UTF-8 bytes.`
      ),
    role: z.enum(USER_ROLES),
  })
  .strict();

const UpdateStatusSchema = z
  .object({
    status: z.enum(USER_MANAGEABLE_STATUSES),
  })
  .strict();

const UpdateRoleSchema = z
  .object({
    role: z.enum(USER_ROLES),
  })
  .strict();

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function safeUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId?.toString(),
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

async function loadOrganizationAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user?.userId) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }

  if (!isDbConnected()) {
    res.status(503).json({
      success: false,
      message: "Database connection required for organization user management.",
    });
    return;
  }

  try {
    const actor = await User.findById(req.user.userId).select(
      "role organizationId organizationName status"
    );

    if (!actor || actor.status !== "active") {
      res.status(401).json({ success: false, message: "Active user account required." });
      return;
    }

    if (actor.role !== "owner" && actor.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only organization owners and administrators may manage users.",
      });
      return;
    }

    if (!actor.organizationId) {
      res.status(403).json({
        success: false,
        message: "Organization membership is required for user management.",
      });
      return;
    }

    req.user = {
      ...req.user,
      role: actor.role,
      organizationId: actor.organizationId.toString(),
      organizationName: actor.organizationName,
    };
    next();
  } catch (error) {
    next(error);
  }
}

router.use(authenticate, loadOrganizationAdmin);

/**
 * GET /api/users
 * List members of the authenticated owner's or administrator's organization.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    res.status(403).json({ success: false, message: "Organization membership is required." });
    return;
  }

  try {
    const users = await User.find({ organizationId })
      .select("_id name email role organizationId status createdAt updatedAt lastLoginAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(safeUser),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 * Create an employee account in the authenticated administrator's organization.
 */
router.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid user data.",
    });
    return;
  }

  const { name, email, password, role } = parsed.data;
  const actor = req.user;
  const organizationId = actor?.organizationId;
  if (!actor || !organizationId) {
    res.status(403).json({ success: false, message: "Organization membership is required." });
    return;
  }

  if ((role === "owner" || role === "admin") && actor.role !== "owner") {
    res.status(403).json({
      success: false,
      message: "Only an organization owner may assign the owner or administrator role.",
    });
    return;
  }

  try {
    const existing = await User.findOne({ email }).select("_id");
    if (existing) {
      res.status(409).json({
        success: false,
        message: "A user with this email address is already registered.",
      });
      return;
    }

    const created = await User.create({
      name,
      email,
      password,
      role,
      organizationId,
      organizationName: actor.organizationName,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "User account created.",
      data: safeUser(created),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "A user with this email address is already registered.",
      });
      return;
    }
    next(error);
  }
});

/**
 * PATCH /api/users/:id/status
 * Activate or suspend a user in the administrator's organization.
 */
router.patch(
  "/:id/status",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      res.status(400).json({ success: false, message: "A valid user ID is required." });
      return;
    }

    const parsed = UpdateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Status must be 'active' or 'suspended'.",
      });
      return;
    }

    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(403).json({ success: false, message: "Organization membership is required." });
      return;
    }

    try {
      const target = await User.findOne({
        _id: req.params.id,
        organizationId,
      });

      if (!target) {
        res.status(404).json({ success: false, message: "User not found in your organization." });
        return;
      }

      if (target._id.toString() === req.user?.userId && parsed.data.status === "suspended") {
        res.status(400).json({ success: false, message: "You cannot suspend your own account." });
        return;
      }

      if (target.role === "owner") {
        res.status(403).json({
          success: false,
          message: "Organization owner accounts cannot be suspended through user management.",
        });
        return;
      }

      if (target.role === "admin" && req.user?.role !== "owner") {
        res.status(403).json({
          success: false,
          message: "Only an organization owner may change an administrator's status.",
        });
        return;
      }

      target.status = parsed.data.status;
      await target.save();

      res.status(200).json({ success: true, data: safeUser(target) });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/users/:id/role
 * Change a user's role within the authenticated organization.
 */
router.patch(
  "/:id/role",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      res.status(400).json({ success: false, message: "A valid user ID is required." });
      return;
    }

    const parsed = UpdateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "A valid role is required.",
      });
      return;
    }

    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(403).json({ success: false, message: "Organization membership is required." });
      return;
    }

    const requestedRole: UserRole = parsed.data.role;
    if (
      (requestedRole === "owner" || requestedRole === "admin") &&
      req.user?.role !== "owner"
    ) {
      res.status(403).json({
        success: false,
        message: "Only an organization owner may assign the owner or administrator role.",
      });
      return;
    }

    try {
      const target = await User.findOne({
        _id: req.params.id,
        organizationId,
      });

      if (!target) {
        res.status(404).json({ success: false, message: "User not found in your organization." });
        return;
      }

      if (target.role === "owner") {
        res.status(403).json({
          success: false,
          message: "Organization owner roles cannot be changed through user management.",
        });
        return;
      }

      if (target.role === "admin" && req.user?.role !== "owner") {
        res.status(403).json({
          success: false,
          message: "Only an organization owner may change an administrator's role.",
        });
        return;
      }

      target.role = requestedRole;
      await target.save();

      res.status(200).json({ success: true, data: safeUser(target) });
    } catch (error) {
      next(error);
    }
  }
);

export const userRoutes = router;
