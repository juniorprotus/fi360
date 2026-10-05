import { Vehicle, FleetMetrics, BackendHealth } from "../types/fleet";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const FALLBACK_VEHICLES: Vehicle[] = [
  {
    _id: "veh_mock_1",
    vin: "1HD1KAE11FB012345",
    plateNumber: "KBZ-482L",
    make: "Mercedes-Benz",
    model: "Actros 2645",
    year: 2023,
    type: "truck",
    status: "active",
    telematicsData: {
      odometerKm: 48250,
      fuelLevelPercent: 78,
      engineHours: 1240,
      batteryVoltage: 24.2,
      currentSpeedKmh: 68,
      location: { latitude: -1.286389, longitude: 36.817223, address: "Mombasa Corridor, Mile 45" },
      lastPing: new Date().toISOString(),
    },
  },
  {
    _id: "veh_mock_2",
    vin: "2T2HZ4EE8KC098765",
    plateNumber: "KDD-109X",
    make: "Isuzu",
    model: "FRR 90",
    year: 2022,
    type: "truck",
    status: "maintenance",
    telematicsData: {
      odometerKm: 98120,
      fuelLevelPercent: 32,
      engineHours: 3410,
      batteryVoltage: 23.4,
      currentSpeedKmh: 0,
      location: { latitude: -1.3197, longitude: 36.8522, address: "Central Workshop - Bay 3" },
      lastPing: new Date().toISOString(),
    },
  },
  {
    _id: "veh_mock_3",
    vin: "3FA6P0H78HR123987",
    plateNumber: "KDA-553M",
    make: "Toyota",
    model: "Hilux D-4D",
    year: 2024,
    type: "pickup",
    status: "critical_failure",
    telematicsData: {
      odometerKm: 28400,
      fuelLevelPercent: 12,
      engineHours: 620,
      batteryVoltage: 11.2,
      currentSpeedKmh: 0,
      location: { latitude: -0.023559, longitude: 37.906193, address: "Northern Route - Checkpoint Bravo" },
      lastPing: new Date().toISOString(),
    },
  },
];

export async function fetchHealth(): Promise<{ data: BackendHealth; isFallback: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isFallback: false };
  } catch {
    return {
      data: {
        status: "standby",
        service: "fi360-backend (connecting...)",
        version: "1.0.0",
        uptime: 0,
        timestamp: new Date().toISOString(),
        database: "offline_fallback",
        modules: { vehicles: "ready", drivers: "ready", maintenance: "ready" },
      },
      isFallback: true,
    };
  }
}

export async function fetchVehicles(): Promise<{ data: Vehicle[]; isFallback: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/vehicles`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { data: json.data || [], isFallback: false };
  } catch {
    return { data: FALLBACK_VEHICLES, isFallback: true };
  }
}

export async function fetchVehicleMetrics(): Promise<{ data: FleetMetrics; isFallback: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/vehicles/metrics`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { data: json.data, isFallback: false };
  } catch {
    return {
      data: {
        active: 1,
        maintenance: 1,
        critical_failure: 1,
        inactive: 0,
        total: 3,
      },
      isFallback: true,
    };
  }
}

export async function fetchAIPrediction(telematicsData: any): Promise<{ data: any; isFallback: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/ai/predict-maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telematicsData }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000), // AI calls take longer
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { data: json.data, isFallback: false };
  } catch (err) {
    console.error("AI API Error:", err);
    // Return a dummy fallback analysis for the frontend preview
    return {
      data: {
        healthScore: 70,
        predictedIssues: [
          {
            component: "Network/API Connection",
            probability: "High",
            timeToFailureDays: 0,
            recommendation: "Backend unreachable. This is a local frontend-only placeholder.",
          },
        ],
        summary: "Could not reach the AI service.",
        isFallback: true,
      },
      isFallback: true,
    };
  }
}
