export type VehicleStatus = "active" | "maintenance" | "critical_failure" | "inactive";
export type VehicleType = "truck" | "van" | "pickup" | "trailer" | "forklift" | "heavy_duty";

export interface TelematicsData {
  odometerKm: number;
  fuelLevelPercent: number;
  engineHours: number;
  batteryVoltage?: number;
  currentSpeedKmh: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  lastPing?: string;
}

export interface Vehicle {
  _id: string;
  id?: string;
  vin: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  status: VehicleStatus;
  organizationId?: string;
  telematicsData: TelematicsData;
  createdAt?: string;
  updatedAt?: string;
}

export interface FleetMetrics {
  active: number;
  maintenance: number;
  critical_failure: number;
  inactive: number;
  total?: number;
}

export interface BackendHealth {
  status: string;
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  database: string;
  modules: Record<string, string>;
}

// AI Types
export interface AIPredictionIssue {
  component: string;
  probability: "Low" | "Medium" | "High";
  timeToFailureDays: number;
  recommendation: string;
}

export interface AIPredictionResponse {
  healthScore: number;
  predictedIssues: AIPredictionIssue[];
  summary: string;
  riskLevel?: "low" | "medium" | "high";
  recommendedAction?: string;
  isFallback?: boolean;
}
