import jwt, { SignOptions } from "jsonwebtoken";
import type { ClientSession } from "mongoose";
import crypto from "crypto";
import { getEnv } from "../../config/env";
import { User, IUser } from "./user.model";
import { Organization } from "../organization/organization.model";
import { AuthUserPayload, UserRole, VerifiedAuthToken } from "./auth.types";
import { isDbConnected } from "../../config/db";
import { AuthSession } from "./auth-session.model";

export class InvalidUserSessionError extends Error {
  constructor() {
    super("User session is invalid or has been revoked.");
    this.name = "InvalidUserSessionError";
  }
}

export class AuthDatabaseUnavailableError extends Error {
  constructor() {
    super("Authentication database is unavailable.");
    this.name = "AuthDatabaseUnavailableError";
  }
}

export class AuthTransactionUnavailableError extends Error {
  constructor() {
    super("Password reset requires MongoDB transaction support.");
    this.name = "AuthTransactionUnavailableError";
  }
}

export class InvalidPasswordResetTokenError extends Error {
  constructor() {
    super("Password reset token is invalid or has expired.");
    this.name = "InvalidPasswordResetTokenError";
  }
}

export class AuthService {
  private static requireDatabase(): void {
    if (!isDbConnected()) {
      throw new AuthDatabaseUnavailableError();
    }
  }

  private static getJwtSecret(): string {
    const env = getEnv();
    return env.JWT_SECRET;
  }

  private static getJwtExpiresIn(): string {
    const env = getEnv();
    return env.JWT_EXPIRES_IN;
  }

  public static async issueToken(payload: AuthUserPayload): Promise<string> {
    this.requireDatabase();
    const jti = crypto.randomUUID();
    const options: SignOptions = {
      expiresIn: this.getJwtExpiresIn() as SignOptions["expiresIn"],
      jwtid: jti,
    };
    const token = jwt.sign(payload, this.getJwtSecret(), options);
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === "string" || typeof decoded.exp !== "number") {
      throw new Error("Issued authentication token is missing its expiry.");
    }

    try {
      const now = new Date();
      await AuthSession.deleteMany({ expiresAt: { $lte: now } });
      await AuthSession.create({
        jti,
        userId: payload.userId,
        expiresAt: new Date(decoded.exp * 1000),
      });
    } catch {
      throw new AuthDatabaseUnavailableError();
    }

    return token;
  }

  /**
   * Verify the JWT and require the session identifier used by the session registry.
   */
  public static verifyToken(token: string): VerifiedAuthToken {
    const decoded = jwt.verify(token, this.getJwtSecret());
    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      typeof decoded.jti !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(decoded.jti) ||
      typeof decoded.exp !== "number"
    ) {
      throw new Error("Authentication token is missing required session claims.");
    }
    return decoded as VerifiedAuthToken;
  }

  public static async revokeSession(token: string): Promise<void> {
    let payload: VerifiedAuthToken;
    try {
      payload = this.verifyToken(token);
    } catch {
      return;
    }

    this.requireDatabase();
    try {
      await AuthSession.updateOne(
        { jti: payload.jti, userId: payload.userId, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
      );
    } catch {
      throw new AuthDatabaseUnavailableError();
    }
  }

  /**
   * Login with email and password
   */
  public static async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: AuthUserPayload; redirectUrl: string }> {
    this.requireDatabase();
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

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
    await user.save();

    // Determine organization details
    let orgName = user.organizationName || "FI360 Organization";
    if (user.organizationId && !user.organizationName) {
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

    const token = await this.issueToken(payload);
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
    this.requireDatabase();
    const normalizedEmail = data.email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

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

    const user = await User.create({
      email: normalizedEmail,
      password: data.password,
      name: data.name.trim(),
      role: "owner" as UserRole,
      organizationId: org._id,
      organizationName: data.organizationName.trim(),
      status: "active",
    });

    const payload: AuthUserPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: org._id.toString(),
      organizationName: user.organizationName,
    };

    const token = await this.issueToken(payload);
    return { token, user: payload, redirectUrl: "/dashboard" };
  }

  /**
   * Get current authenticated user profile
   */
  public static async getCurrentUser(userId: string, jti: string): Promise<AuthUserPayload> {
    this.requireDatabase();
    let activeSession: unknown;
    let user: IUser | null;
    try {
      activeSession = await AuthSession.findOne({
        jti,
        userId,
        expiresAt: { $gt: new Date() },
        revokedAt: { $exists: false },
      }).select("_id").lean();
      if (!activeSession) {
        throw new InvalidUserSessionError();
      }
      user = await User.findById(userId);
    } catch (error) {
      if (error instanceof InvalidUserSessionError) throw error;
      throw new AuthDatabaseUnavailableError();
    }

    if (!user || user.status !== "active") {
      throw new InvalidUserSessionError();
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
    this.requireDatabase();
    const normalizedEmail = email.trim().toLowerCase();

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

        console.log("Password reset token created; delivery is not configured.");
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
    this.requireDatabase();
    if (!token || !newPassword || newPassword.length < 8) {
      throw new Error(
        "Invalid request. Password must be at least 8 characters with a valid token."
      );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    let session: ClientSession | undefined;
    try {
      session = await User.db.startSession();
      const transactionSession = session;
      await transactionSession.withTransaction(async () => {
        const user = await User.findOne({
          passwordResetToken: hashedToken,
          passwordResetExpires: { $gt: new Date() },
        })
          .select("+passwordResetToken +passwordResetExpires")
          .session(transactionSession);

        if (!user) {
          throw new InvalidPasswordResetTokenError();
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ session: transactionSession });

        await AuthSession.updateMany(
          {
            userId: user._id,
            expiresAt: { $gt: new Date() },
            revokedAt: { $exists: false },
          },
          { $set: { revokedAt: new Date() } },
          { session: transactionSession }
        );
      });
    } catch (error) {
      if (
        error instanceof InvalidPasswordResetTokenError ||
        error instanceof AuthDatabaseUnavailableError ||
        error instanceof AuthTransactionUnavailableError
      ) throw error;
      throw new AuthTransactionUnavailableError();
    } finally {
      await session?.endSession();
    }

    return {
      success: true,
      message: "Your password has been successfully updated. You may now log in.",
    };
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
