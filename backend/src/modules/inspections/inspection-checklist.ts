export interface InspectionChecklistItem {
  id: string;
  category: string;
  label: string;
  critical: boolean;
  vehicleTypes?: string[];
}

export const INSPECTION_CHECKLIST: InspectionChecklistItem[] = [
  { id: "service-brakes", category: "Brakes", label: "Service brakes and parking brake", critical: true },
  { id: "air-pressure", category: "Brakes", label: "Air pressure, lines and warning devices", critical: true, vehicleTypes: ["truck", "heavy_duty", "trailer"] },
  { id: "steering", category: "Steering", label: "Steering wheel, linkage and power steering", critical: true },
  { id: "tires", category: "Wheels and tyres", label: "Tyre condition, tread, inflation and wheel fasteners", critical: true },
  { id: "lights", category: "Lights and signals", label: "Headlights, indicators, brake lights and reflectors", critical: true },
  { id: "coupling", category: "Coupling", label: "Coupling, fifth wheel, kingpin and safety connections", critical: true, vehicleTypes: ["trailer"] },
  { id: "windshield", category: "Visibility", label: "Windshield, mirrors and required visibility", critical: false },
  { id: "wipers", category: "Visibility", label: "Wipers and washers", critical: false },
  { id: "horn", category: "Safety equipment", label: "Horn and reversing alarm", critical: false },
  { id: "seat-belt", category: "Safety equipment", label: "Seat belt and cab safety restraints", critical: false, vehicleTypes: ["truck", "van", "pickup", "forklift", "heavy_duty"] },
  { id: "emergency-equipment", category: "Safety equipment", label: "Fire extinguisher, warning triangles and first aid kit", critical: false, vehicleTypes: ["truck", "van", "pickup", "heavy_duty"] },
  { id: "fluid-leaks", category: "Engine and fluids", label: "Visible fuel, oil, coolant or hydraulic leaks", critical: true },
  { id: "engine-fluids", category: "Engine and fluids", label: "Engine oil, coolant and other required fluid levels", critical: false, vehicleTypes: ["truck", "van", "pickup", "forklift", "heavy_duty"] },
  { id: "battery", category: "Electrical", label: "Battery, wiring and electrical connections", critical: false },
  { id: "exhaust", category: "Engine and fluids", label: "Exhaust system and abnormal smoke", critical: true, vehicleTypes: ["truck", "van", "pickup", "forklift", "heavy_duty"] },
  { id: "body-frame", category: "Vehicle condition", label: "Body, chassis, frame and doors", critical: false },
  { id: "cargo-securement", category: "Load and cargo", label: "Load securement and cargo doors", critical: true },
  { id: "odometer", category: "Records", label: "Odometer reading recorded accurately", critical: false },
  { id: "forklift-mast", category: "Equipment", label: "Forks, mast, lift chains and hydraulics", critical: true, vehicleTypes: ["forklift"] },
  { id: "forklift-overhead-guard", category: "Equipment", label: "Overhead guard and operator restraint", critical: true, vehicleTypes: ["forklift"] },
];

export function getChecklistForVehicle(vehicleType: string) {
  return INSPECTION_CHECKLIST.filter(
    (item) => !item.vehicleTypes || item.vehicleTypes.includes(vehicleType)
  );
}
