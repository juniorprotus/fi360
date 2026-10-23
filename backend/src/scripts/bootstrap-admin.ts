/**
 * FI360 Administrator Bootstrap Script
 * =====================================
 * Safely provisions an initial Organization Owner / Administrator for fresh deployments.
 *
 * Rules:
 * - Refuses to overwrite existing accounts.
 * - Does not use or assume default passwords; requires BOOTSTRAP_ADMIN_PASSWORD (min 10 chars).
 * - Never prints passwords in stdout or logs.
 *
 * Usage:
 *   BOOTSTRAP_ADMIN_EMAIL="admin@yourcompany.com" \
 *   BOOTSTRAP_ADMIN_PASSWORD="YourStrongPasswordHere" \
 *   BOOTSTRAP_ADMIN_NAME="Initial Admin" \
 *   BOOTSTRAP_ORG_NAME="Your Fleet Co" \
 *   npm run bootstrap:admin
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../modules/auth/user.model";
import { Organization } from "../modules/organization/organization.model";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const NAME = process.env.BOOTSTRAP_ADMIN_NAME || "System Administrator";
const ORG_NAME = process.env.BOOTSTRAP_ORG_NAME || "Enterprise Fleet HQ";

async function bootstrap() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set. Cannot connect to database.");
    process.exit(1);
  }

  if (!EMAIL || !PASSWORD) {
    console.error(
      "❌ Configuration missing:\n" +
        "   Please provide both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in environment variables.\n" +
        "   Password must be at least 10 characters long."
    );
    process.exit(1);
  }

  if (PASSWORD.length < 10) {
    console.error("❌ Security failure: BOOTSTRAP_ADMIN_PASSWORD must be at least 10 characters long.");
    process.exit(1);
  }

  console.log("🔒 Connecting to database for admin bootstrap...");
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    retryWrites: true,
    w: "majority",
  });

  // Check if an account with this email already exists
  const existingUser = await User.findOne({ email: EMAIL });
  if (existingUser) {
    console.warn(`⚠️  User account for '${EMAIL}' already exists (${existingUser.role}). Refusing to overwrite.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  // Ensure organization exists
  const slug = ORG_NAME.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  let org = await Organization.findOne({ slug });
  if (!org) {
    org = await Organization.create({
      name: ORG_NAME,
      slug,
      plan: "enterprise",
      enabledModules: ["vehicles", "drivers", "maintenance", "telematics", "fuel", "ai"],
    });
    console.log(`🏢 Created organization: "${org.name}" (${org._id})`);
  } else {
    console.log(`🏢 Linked to existing organization: "${org.name}" (${org._id})`);
  }

  // Create owner account
  const newAdmin = await User.create({
    email: EMAIL,
    password: PASSWORD,
    name: NAME,
    role: "owner",
    organizationId: org._id,
    organizationName: org.name,
    status: "active",
  });

  console.log(`✅ Successfully bootstrapped Organization Owner: ${newAdmin.email} (${newAdmin._id})`);
  console.log("🚀 You can now sign in at /login with these credentials.");

  await mongoose.disconnect();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error("❌ Bootstrap error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
