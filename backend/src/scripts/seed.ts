/**
 * FI360 Database Seed Script
 * ===========================
 * Seeds the MongoDB Atlas M0 database with initial data.
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." npx tsx src/scripts/seed.ts
 *
 * OR (after npm run build):
 *   MONGODB_URI="mongodb+srv://..." node dist/scripts/seed.js
 *
 * ⚠️  This is IDEMPOTENT — safe to run multiple times (uses upsert).
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { Organization } from "../modules/organization/organization.model";
import { Vehicle } from "../modules/vehicle/vehicle.model";
import { Driver } from "../modules/drivers/driver.model";
import { MaintenanceLog } from "../modules/maintenance/maintenance.model";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set. Cannot run seed script.");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Connecting to MongoDB Atlas for seeding...");
  await mongoose.connect(MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
    retryWrites: true,
    w: "majority",
  });
  console.log("✅ Connected.\n");

  // ── 1. Organization ──────────────────────────────────────────────────────
  const org = await Organization.findOneAndUpdate(
    { slug: "national-logistics-hub" },
    {
      name: "National Logistics Hub",
      slug: "national-logistics-hub",
      enabledModules: ["vehicles", "drivers", "maintenance", "telematics", "ai"],
      contactEmail: "ops@nationalhub.co.ke",
      phone: "+254 700 123 456",
      country: "Kenya",
      fleetSize: 47,
      plan: "pro",
    },
    { upsert: true, new: true }
  );
  console.log(`✅ Organization: "${org.name}" (${org._id})`);

  // ── 2. Vehicles ──────────────────────────────────────────────────────────
  const vehiclesData = [
    {
      vin: "1HD1KAE11FB012345",
      plateNumber: "KBZ-482L",
      make: "Mercedes-Benz",
      model: "Actros 2645",
      year: 2023,
      type: "truck",
      status: "active",
      organizationId: org._id,
      telematicsData: {
        odometerKm: 48250,
        fuelLevelPercent: 78,
        engineHours: 1240,
        batteryVoltage: 24.2,
        currentSpeedKmh: 0,
        location: { latitude: -1.286389, longitude: 36.817223, address: "Mombasa Corridor, Mile 45" },
        lastPing: new Date(),
      },
    },
    {
      vin: "2T2HZ4EE8KC098765",
      plateNumber: "KDD-109X",
      make: "Isuzu",
      model: "FRR 90",
      year: 2022,
      type: "truck",
      status: "maintenance",
      organizationId: org._id,
      telematicsData: {
        odometerKm: 98120,
        fuelLevelPercent: 32,
        engineHours: 3410,
        batteryVoltage: 23.4,
        currentSpeedKmh: 0,
        location: { latitude: -1.3197, longitude: 36.8522, address: "Central Workshop - Bay 3" },
        lastPing: new Date(),
      },
    },
    {
      vin: "3FA6P0H78HR123987",
      plateNumber: "KDA-553M",
      make: "Toyota",
      model: "Hilux D-4D",
      year: 2024,
      type: "pickup",
      status: "critical_failure",
      organizationId: org._id,
      telematicsData: {
        odometerKm: 28400,
        fuelLevelPercent: 12,
        engineHours: 620,
        batteryVoltage: 11.2,
        currentSpeedKmh: 0,
        location: { latitude: -0.023559, longitude: 37.906193, address: "Northern Route - Checkpoint Bravo" },
        lastPing: new Date(),
      },
    },
  ];

  const vehicleIds: mongoose.Types.ObjectId[] = [];
  for (const v of vehiclesData) {
    const vehicle = await Vehicle.findOneAndUpdate(
      { vin: v.vin },
      v,
      { upsert: true, new: true }
    );
    vehicleIds.push(vehicle._id as mongoose.Types.ObjectId);
    console.log(`  ✅ Vehicle: ${vehicle.plateNumber} (${vehicle.status})`);
  }

  // ── 3. Drivers ───────────────────────────────────────────────────────────
  const driversData = [
    {
      fullName: "Samuel Kiprop",
      licenseNumber: "DL-908122-A",
      licenseClass: "Class A Heavy Goods",
      licenseExpiry: new Date("2027-11-15"),
      phone: "+254 712 345 678",
      status: "active",
      performanceScore: 94,
    },
    {
      fullName: "Amina Noor",
      licenseNumber: "DL-455201-B",
      licenseClass: "Class B Articulated",
      licenseExpiry: new Date("2026-08-20"),
      phone: "+254 722 987 654",
      status: "active",
      performanceScore: 98,
    },
  ];

  for (const d of driversData) {
    const driver = await Driver.findOneAndUpdate(
      { licenseNumber: d.licenseNumber },
      d,
      { upsert: true, new: true }
    );
    console.log(`  ✅ Driver: ${driver.fullName} (score: ${driver.performanceScore})`);
  }

  // ── 4. Maintenance Logs ───────────────────────────────────────────────────
  const maintenanceData = [
    {
      vehicleId: vehicleIds[1], // KDD-109X (maintenance)
      type: "brake_system",
      status: "in_progress",
      priority: "high",
      description: "Brake pad replacement and hydraulic pressure calibration on axle 2",
      cost: 450,
      scheduledDate: new Date(),
      odometerKmAtService: 98120,
      workshopNotes: "Calipers inspected. Fluid flushed.",
    },
    {
      vehicleId: vehicleIds[2], // KDA-553M (critical_failure)
      type: "emergency_repair",
      status: "scheduled",
      priority: "urgent",
      description: "Alternator malfunction and critical low battery voltage alert",
      cost: 320,
      scheduledDate: new Date(),
      odometerKmAtService: 28400,
      workshopNotes: "Towing arranged to nearest service hub.",
    },
  ];

  for (const m of maintenanceData) {
    const log = await MaintenanceLog.findOneAndUpdate(
      { vehicleId: m.vehicleId, type: m.type, status: m.status },
      m,
      { upsert: true, new: true }
    );
    console.log(`  ✅ Maintenance: ${log.type} — ${log.priority} priority (${log.status})`);
  }

  console.log("\n🎉 Seed complete! All documents upserted to MongoDB Atlas.\n");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
