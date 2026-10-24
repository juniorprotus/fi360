import assert from "node:assert/strict";
import {
  PredictiveMaintenanceRequestSchema,
} from "../modules/ai/ai.schema";
import { DriverCreateSchema } from "../modules/drivers/driver.schema";
import { MaintenanceCreateSchema } from "../modules/maintenance/maintenance.schema";
import { OrganizationCreateSchema, ModuleEnum } from "../modules/organization/organization.schema";
import { VehicleCreateSchema } from "../modules/vehicle/vehicle.schema";

function check(condition: boolean, message: string): void {
  assert.ok(condition, message);
  console.log(`PASS: ${message}`);
}

const vehicle = {
  vin: "ABCDE",
  plateNumber: "AB",
  make: "M",
  model: "M",
  year: 1970,
  type: "truck" as const,
};
const parsedVehicle = VehicleCreateSchema.safeParse(vehicle);
check(parsedVehicle.success, "vehicle accepts required minimum-length fields and lower year boundary");
if (parsedVehicle.success) {
  assert.equal(parsedVehicle.data.status, "active");
  console.log("PASS: vehicle status default is preserved");
}
check(
  !VehicleCreateSchema.safeParse({ ...vehicle, vin: "ABCD" }).success,
  "vehicle rejects VIN below minimum length"
);
check(
  VehicleCreateSchema.safeParse({ ...vehicle, year: 2100 }).success,
  "vehicle accepts upper year boundary"
);
check(
  !VehicleCreateSchema.safeParse({ ...vehicle, year: 2101 }).success,
  "vehicle rejects year above maximum"
);

const driver = {
  fullName: "Jo",
  licenseNumber: "ABCDE",
  licenseExpiry: "",
  phone: "1234567",
  performanceScore: 100,
};
const parsedDriver = DriverCreateSchema.safeParse(driver);
check(parsedDriver.success, "driver accepts required boundary values");
if (parsedDriver.success) {
  assert.equal(parsedDriver.data.licenseClass, "Heavy Commercial");
  assert.equal(parsedDriver.data.status, "active");
  assert.equal(parsedDriver.data.performanceScore, 100);
  console.log("PASS: driver defaults and performance boundary are preserved");
}
check(
  !DriverCreateSchema.safeParse({ ...driver, performanceScore: 101 }).success,
  "driver rejects performance score above maximum"
);
check(
  !DriverCreateSchema.safeParse({ ...driver, fullName: undefined }).success,
  "driver rejects missing required fields"
);

const organization = {
  name: "AB",
  slug: "ab",
};
const parsedOrganization = OrganizationCreateSchema.safeParse(organization);
check(parsedOrganization.success, "organization accepts required minimum-length fields");
if (parsedOrganization.success) {
  assert.deepEqual(parsedOrganization.data.enabledModules, ["vehicles", "drivers", "maintenance"]);
  assert.equal(parsedOrganization.data.plan, "free");
  console.log("PASS: organization defaults are preserved");
}
const allModules = ModuleEnum.options;
check(
  OrganizationCreateSchema.safeParse({ ...organization, enabledModules: allModules }).success,
  "organization accepts every supported module"
);
check(
  !OrganizationCreateSchema.safeParse({
    ...organization,
    enabledModules: [...allModules, allModules[0]],
  }).success,
  "organization rejects module collections longer than the six supported modules"
);
const invalidOrganization = OrganizationCreateSchema.safeParse({
  ...organization,
  name: "A",
});
check(!invalidOrganization.success, "organization rejects invalid minimum name length");
if (!invalidOrganization.success) {
  assert.deepEqual(Object.keys(invalidOrganization.error.flatten().fieldErrors), ["name"]);
  console.log("PASS: Zod field-error format remains compatible");
}

const maintenance = {
  vehicleId: "vehicle-1",
  type: "inspection" as const,
  description: "x".repeat(500),
  scheduledDate: "",
};
const parsedMaintenance = MaintenanceCreateSchema.safeParse(maintenance);
check(parsedMaintenance.success, "maintenance accepts the maximum description boundary");
if (parsedMaintenance.success) {
  assert.equal(parsedMaintenance.data.status, "scheduled");
  assert.equal(parsedMaintenance.data.priority, "medium");
  assert.equal(parsedMaintenance.data.cost, 0);
  console.log("PASS: maintenance defaults are preserved");
}
check(
  !MaintenanceCreateSchema.safeParse({
    ...maintenance,
    description: `${maintenance.description}x`,
  }).success,
  "maintenance rejects descriptions above maximum length"
);

const predictive = {
  telematicsData: {
    make: "Make",
    model: "Model",
    year: 2024,
    odometerKm: 0,
    engineHours: 0,
    recentFaultCodes: ["P0300", "P0420"],
  },
};
check(
  PredictiveMaintenanceRequestSchema.safeParse(predictive).success,
  "AI request accepts valid data and multiple fault codes"
);
check(
  !PredictiveMaintenanceRequestSchema.safeParse({
    telematicsData: { ...predictive.telematicsData, year: undefined },
  }).success,
  "AI request rejects missing required fields"
);

