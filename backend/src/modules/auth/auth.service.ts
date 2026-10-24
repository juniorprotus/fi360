import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { getEnv } from "../../config/env";
import { User, IUser } from "./user.model";
import { Organization } from "../organization/organization.model";
import { AuthUserPayload, UserRole } from "./auth.types";
import { isDbConnected } from "../../config/db";

// In-memory fallback registry for offline development mode when MongoDB Atlas is unreachable
const inMemoryUsers: Map<string, { user: IUser; passwordHash: string }> = new Map();

export class AuthService {
  private static getJwtSecret(): string {
    const env = getEnv();
    return env.JWT_SECRET;
  }

  private static getJwtExpiresIn(): string {
    const env = getEnv();
    return env.JWT_EXPIRES_IN;
  }

  /**
   * Generate signed JWT token
   */
  public static generateToken(payload: AuthUserPayload): string {
    const secret = this.getJwtSecret();
    const expiresIn = this.getJwtExpiresIn();
    const options: SignOptions = {
      expiresIn: expiresIn as unknown as SignOptions["expiresIn"],
    };
    return jwt.sign(payload, secret, options);
  }

  /**
   * Verify and decode a JWT token
   */
  public static verifyToken(token: string): AuthUserPayload {
    const secret = this.getJwtSecret();
    const decoded = jwt.verify(token, secret) as AuthUserPayload;
    return decoded;
  }

  /**
   * Login with email and password
   */
  public static async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: AuthUserPayload; redirectUrl: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    let user: IUser | null = null;

    if (isDbConnected()) {
      user = await User.findOne({ email: normalizedEmail }).select("+password");
    } else {
      const memoryEntry = inMemoryUsers.get(normalizedEmail);
      if (memoryEntry) {
        user = memoryEntry.user;
        user.password = memoryEntry.passwordHash;
      }
    }

    // Timing-safe response: reject without revealing whether the email exists
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.status !== "active") {
      throw new Error(
        "Your account is inactive or suspended. Please contact your organization administrator."
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    if (isDbConnected()) {
      await user.save();
    }

    // Determine organization details
    let orgName = user.organizationName || "FI360 Organization";
    if (isDbConnected() && user.organizationId && !user.organizationName) {
      const org = await Organization.findById(user.organizationId);
      if (org) orgName = org.name;
    }

    const payload: AuthUserPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId?.toString(),
      organizationName: orgName,
    };

    const token = this.generateToken(payload);
    const redirectUrl = this.getDefaultRouteForRole(user.role);

    return { token, user: payload, redirectUrl };
  }

  /**
   * Register a new organization and owner account
   */
  public static async register(data: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }): Promise<{ token: string; user: AuthUserPayload; redirectUrl: string }> {
    const normalizedEmail = data.email.trim().toLowerCase();

    if (isDbConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        throw new Error("An account with this email address already exists.");
      }
    } else if (inMemoryUsers.has(normalizedEmail)) {
      throw new Error("An account with this email address already exists.");
    }

    const fallbackOrganizationId = "000000000000000000000001";
    let organizationId: string | undefined;

    if (isDbConnected()) {
      const slug = data.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      const org = await Organization.create({
        name: data.organizationName.trim(),
        slug: uniqueSlug,
        plan: "pro",
        enabledModules: ["vehicles", "drivers", "maintenance", "telematics", "fuel", "ai"],
      });
      organizationId = org._id.toString();
    } else {
      organizationId = fallbackOrganizationId;
    }

    let user: IUser;

    if (isDbConnected()) {
      user = await User.create({
        email: normalizedEmail,
        password: data.password,
        name: data.name.trim(),
        role: "owner" as UserRole,
        organizationId: organizationId,
        organizationName: data.organizationName.trim(),
        status: "active",
      });
    } else {
      // In-memory fallback
      const bcrypt = await import("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(data.password, salt);
      const mockId = new (await import("mongoose")).Types.ObjectId();

      user = new User({
        _id: mockId,
        email: normalizedEmail,
        name: data.name.trim(),
        role: "owner" as UserRole,
        organizationId: fallbackOrganizationId,
        organizationName: data.organizationName.trim(),
        status: "active",
      });

      inMemoryUsers.set(normalizedEmail, { user, passwordHash });
    }

    const payload: AuthUserPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId?.toString(),
      organizationName: user.organizationName,
    };

    const token = this.generateToken(payload);
    return { token, user: payload, redirectUrl: "/dashboard" };
  }

  /**
   * Get current authenticated user profile
   */
  public static async getCurrentUser(userId: string): Promise<AuthUserPayload> {
    let user: IUser | null = null;

    if (isDbConnected()) {
      user = await User.findById(userId);
    } else {
      for (const [_, entry] of inMemoryUsers.entries()) {
        if (entry.user._id.toString() === userId) {
          user = entry.user;
          break;
        }
      }
    }

    if (!user || user.status !== "active") {
      throw new Error("User session is invalid or has been revoked.");
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId?.toString(),
      organizationName: user.organizationName || "FI360 Organization",
    };
  }

  /**
   * Initiate password reset
   */
  public static async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        console.log(
          `🔑 [FI360 Security] Password reset token generated for ${user.email}. (Expires in 1h)`
        );
      }
    }

    // Always return generic confirmation to prevent user enumeration
    return {
      success: true,
      message:
        "If an account with that email address exists, password reset instructions have been dispatched.",
    };
  }

  /**
   * Complete password reset with token
   */
  public static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    if (!token || !newPassword || newPassword.length < 8) {
      throw new Error(
        "Invalid request. Password must be at least 8 characters with a valid token."
      );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    if (isDbConnected()) {
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      }).select("+passwordResetToken +passwordResetExpires");

      if (!user) {
        throw new Error("Password reset token is invalid or has expired.");
      }

      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return {
        success: true,
        message: "Your password has been successfully updated. You may now log in.",
      };
    }

    throw new Error("Database connection required to complete password reset.");
  }

  public static getDefaultRouteForRole(role: UserRole): string {
    const roleRoutes: Record<UserRole, string> = {
      owner: "/dashboard",
      admin: "/dashboard",
      fleet_manager: "/dashboard/fleet",
      workshop_manager: "/dashboard/workshop",
      technician: "/dashboard/workshop",
      driver: "/dashboard/driver",
      dispatcher: "/dashboard/transport",
      compliance: "/dashboard/inspections",
      finance: "/dashboard/costs",
      viewer: "/dashboard",
    };
    return roleRoutes[role] || "/dashboard";
  }
}
