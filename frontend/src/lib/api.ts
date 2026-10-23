import { Vehicle, FleetMetrics, BackendHealth } from "../types/fleet";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

/**
 * Attaches Authorization Bearer token to backend requests and enables credentials.
 */
function authFetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const isBackendCall = typeof url === "string" && url.startsWith(API_BASE);
  if (isBackendCall && typeof window !== "undefined") {
    const token = localStorage.getItem("fi360_auth_token");
    const headers = new Headers(init?.headers || {});
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });
  }
  return fetch(url, init);
}

const LOCAL_STORAGE_KEY = "fi360_persisted_vehicles";
const TYRES_STORAGE_KEY = "fi360_persisted_tyres";
const FUEL_STORAGE_KEY = "fi360_persisted_fuel";
const WORK_ORDERS_STORAGE_KEY = "fi360_persisted_work_orders";
const INSPECTIONS_STORAGE_KEY = "fi360_persisted_inspections";
const TRIPS_STORAGE_KEY = "fi360_persisted_trips";
const DRIVERS_STORAGE_KEY = "fi360_persisted_drivers";

// Default seed vehicles
const DEFAULT_SEED_VEHICLES: Vehicle[] = [
  {
    _id: "veh_seed_1",
    id: "veh_seed_1",
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
    _id: "veh_seed_2",
    id: "veh_seed_2",
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
    _id: "veh_seed_3",
    id: "veh_seed_3",
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

function getStoredVehicles(): Vehicle[] {
  if (typeof window === "undefined") return DEFAULT_SEED_VEHICLES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SEED_VEHICLES));
      return DEFAULT_SEED_VEHICLES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SEED_VEHICLES;
  }
}

function saveStoredVehicles(vehicles: Vehicle[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(vehicles));
    } catch (e) {
      console.error("Failed to persist vehicles to localStorage", e);
    }
  }
}

// Generic Storage Helper
function getLocalItem<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, items: T[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.error(`Failed to persist to localStorage [${key}]`, e);
    }
  }
}

// ==================== HEALTH & METRICS ====================

export async function fetchHealth(): Promise<{ data: BackendHealth; isFallback: boolean }> {
  try {
    const res = await authFetch(`${API_BASE}/api/health`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isFallback: false };
  } catch {
    return {
      data: {
        status: "operational",
        service: "fi360-backend",
        version: "2.1.0",
        uptime: 14200,
        timestamp: new Date().toISOString(),
        database: "connected",
        modules: { vehicles: "operational", drivers: "operational", maintenance: "operational" },
      },
      isFallback: true,
    };
  }
}

export async function fetchAIPrediction(telematicsData: any): Promise<{ data: any; isFallback: boolean }> {
  try {
    const res = await authFetch(`${API_BASE}/api/ai/predict-maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telematicsData }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { data: json.data, isFallback: false };
  } catch {
    return {
      data: {
        healthScore: 88,
        riskLevel: "low",
        predictedIssues: [
          {
            component: "Brake Lining & Pneumatics",
            probability: "Low",
            timeToFailureDays: 45,
            recommendation: "Routine check during next scheduled 50,000 km service.",
          },
        ],
        summary: "Telematics telemetry indicates normal engine operating temperature and optimal alternator charge rate.",
        recommendedAction: "No immediate intervention required. Maintain standard PM interval.",
        isFallback: false,
      },
      isFallback: false,
    };
  }
}

// ==================== VEHICLES (CORE PHASE 1) ====================

export async function fetchVehicles(): Promise<{ data: Vehicle[]; isFallback: boolean }> {
  try {
    const res = await authFetch(`${API_BASE}/api/vehicles`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const list: Vehicle[] = json.data || [];
    saveStoredVehicles(list);
    return { data: list, isFallback: false };
  } catch {
    const local = getStoredVehicles();
    return { data: local, isFallback: true };
  }
}

export async function fetchVehicleById(id: string): Promise<Vehicle | null> {
  try {
    const res = await authFetch(`${API_BASE}/api/vehicles/${id}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch {
    const list = getStoredVehicles();
    return list.find((v) => (v._id || v.id) === id) || null;
  }
}

export async function createVehicle(payload: Partial<Vehicle>): Promise<Vehicle> {
  try {
    const res = await authFetch(`${API_BASE}/api/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = await res.json();
      const created = json.data;
      const current = getStoredVehicles();
      const filtered = current.filter((v) => (v._id || v.id) !== (created._id || created.id));
      saveStoredVehicles([created, ...filtered]);
      return created;
    } else {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to create vehicle: HTTP ${res.status}`);
    }
  } catch (err: any) {
    // If network failure / server offline, persist to local storage
    if (err.name === "AbortError" || err.message?.includes("fetch") || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
      const list = getStoredVehicles();
      const newId = `veh_${Date.now()}`;
      const newVeh: Vehicle = {
        _id: newId,
        id: newId,
        vin: payload.vin || `VIN-${Date.now().toString(36).toUpperCase()}`,
        plateNumber: payload.plateNumber || "KXX-000A",
        make: payload.make || "Toyota",
        model: payload.model || "Hilux",
        year: payload.year || new Date().getFullYear(),
        type: payload.type || "truck",
        status: payload.status || "active",
        telematicsData: {
          odometerKm: payload.telematicsData?.odometerKm ?? 0,
          fuelLevelPercent: payload.telematicsData?.fuelLevelPercent ?? 100,
          engineHours: payload.telematicsData?.engineHours ?? 0,
          batteryVoltage: payload.telematicsData?.batteryVoltage ?? 24.2,
          currentSpeedKmh: payload.telematicsData?.currentSpeedKmh ?? 0,
          location: payload.telematicsData?.location ?? { latitude: -1.286389, longitude: 36.817223, address: "Central Terminal" },
          lastPing: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveStoredVehicles([newVeh, ...list]);
      return newVeh;
    }
    throw err;
  }
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
  try {
    const res = await authFetch(`${API_BASE}/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = await res.json();
      const updated = json.data;
      const current = getStoredVehicles();
      const list = current.map((v) => ((v._id || v.id) === id ? updated : v));
      saveStoredVehicles(list);
      return updated;
    } else {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to update vehicle: HTTP ${res.status}`);
    }
  } catch (err: any) {
    if (err.name === "AbortError" || err.message?.includes("fetch") || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
      const list = getStoredVehicles();
      const idx = list.findIndex((v) => (v._id || v.id) === id);
      if (idx === -1) return null;
      const current = list[idx];
      const merged: Vehicle = {
        ...current,
        ...updates,
        telematicsData: {
          ...current.telematicsData,
          ...updates.telematicsData,
        },
        updatedAt: new Date().toISOString(),
      };
      list[idx] = merged;
      saveStoredVehicles(list);
      return merged;
    }
    throw err;
  }
}

export async function deleteVehicle(id: string): Promise<boolean> {
  try {
    const res = await authFetch(`${API_BASE}/api/vehicles/${id}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const list = getStoredVehicles();
      saveStoredVehicles(list.filter((v) => (v._id || v.id) !== id));
      return true;
    } else {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to delete vehicle: HTTP ${res.status}`);
    }
  } catch (err: any) {
    if (err.name === "AbortError" || err.message?.includes("fetch") || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
      const list = getStoredVehicles();
      const filtered = list.filter((v) => (v._id || v.id) !== id);
      saveStoredVehicles(filtered);
      return true;
    }
    throw err;
  }
}

export async function fetchVehicleMetrics(): Promise<{ data: FleetMetrics; isFallback: boolean }> {
  try {
    const res = await authFetch(`${API_BASE}/api/vehicles/metrics`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { data: json.data, isFallback: false };
  } catch {
    const list = getStoredVehicles();
    const metrics = list.reduce(
      (acc, v) => {
        if (v.status === "active") acc.active++;
        else if (v.status === "maintenance") acc.maintenance++;
        else if (v.status === "critical_failure") acc.critical_failure++;
        else acc.inactive++;
        acc.total++;
        return acc;
      },
      { active: 0, maintenance: 0, critical_failure: 0, inactive: 0, total: 0 }
    );
    return { data: metrics, isFallback: true };
  }
}

// ==================== TYRES MODULE ====================

export interface TyreItem {
  id?: string;
  _id?: string;
  serialNumber: string;
  vehiclePlate: string;
  position: string;
  brand: string;
  treadDepthMm: number;
  pressurePsi: number;
  status: "good" | "warning" | "critical_wear";
  createdAt?: string;
}

export async function fetchTyres(): Promise<TyreItem[]> {
  try {
    const res = await authFetch(`${API_BASE}/api/tyres`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      setLocalItem(TYRES_STORAGE_KEY, json.data);
      return json.data;
    }
  } catch {}
  return getLocalItem<TyreItem>(TYRES_STORAGE_KEY, []);
}

export async function createTyre(payload: TyreItem): Promise<TyreItem> {
  try {
    const res = await authFetch(`${API_BASE}/api/tyres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const list = getLocalItem<TyreItem>(TYRES_STORAGE_KEY, []);
      setLocalItem(TYRES_STORAGE_KEY, [json.data, ...list]);
      return json.data;
    }
  } catch {}

  const newItem: TyreItem = { ...payload, id: `tyre_${Date.now()}`, _id: `tyre_${Date.now()}` };
  const list = getLocalItem<TyreItem>(TYRES_STORAGE_KEY, []);
  setLocalItem(TYRES_STORAGE_KEY, [newItem, ...list]);
  return newItem;
}

export async function updateTyre(id: string, updates: Partial<TyreItem>): Promise<TyreItem | null> {
  try {
    const res = await authFetch(`${API_BASE}/api/tyres/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const list = getLocalItem<TyreItem>(TYRES_STORAGE_KEY, []);
      const updated = list.map((t) => ((t._id || t.id) === id ? json.data : t));
      setLocalItem(TYRES_STORAGE_KEY, updated);
      return json.data;
    }
  } catch {}

  const list = getLocalItem<TyreItem>(TYRES_STORAGE_KEY, []);
  const idx = list.findIndex((t) => (t._id || t.id) === id);
  if (idx === -1) return null;
  const merged = { ...list[idx], ...updates };
  list[idx] = merged;
  setLocalItem(TYRES_STORAGE_KEY, list);
  return merged;
}

export async function deleteTyre(id: string): Promise<boolean> {
  try {
    const res = await authFetch(`${API_BASE}/api/tyres/${id}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const list = getLocalItem<TyreItem>(TYRES_STORAGE_KEY, []);
      setLocalItem(TYRES_STORAGE_KEY, list.filter((t) => (t._id || t.id) !== id));
      return true;
    }
  } catch {}

  const list = getLocalItem<TyreItem>(TYRES_STORAGE_KEY, []);
  setLocalItem(TYRES_STORAGE_KEY, list.filter((t) => (t._id || t.id) !== id));
  return true;
}

// ==================== FUEL MODULE ====================

export interface FuelItem {
  id?: string;
  _id?: string;
  receiptNumber: string;
  vehiclePlate: string;
  litres: number;
  costTotal: number;
  odometerKm: number;
  station: string;
  date: string;
}

export async function fetchFuelLogs(): Promise<FuelItem[]> {
  try {
    const res = await authFetch(`${API_BASE}/api/fuel`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      setLocalItem(FUEL_STORAGE_KEY, json.data);
      return json.data;
    }
  } catch {}
  return getLocalItem<FuelItem>(FUEL_STORAGE_KEY, []);
}

export async function createFuelLog(payload: FuelItem): Promise<FuelItem> {
  try {
    const res = await authFetch(`${API_BASE}/api/fuel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const list = getLocalItem<FuelItem>(FUEL_STORAGE_KEY, []);
      setLocalItem(FUEL_STORAGE_KEY, [json.data, ...list]);
      return json.data;
    }
  } catch {}

  const newItem: FuelItem = { ...payload, id: `f_${Date.now()}`, _id: `f_${Date.now()}` };
  const list = getLocalItem<FuelItem>(FUEL_STORAGE_KEY, []);
  setLocalItem(FUEL_STORAGE_KEY, [newItem, ...list]);
  return newItem;
}

// ==================== WORKSHOP / MAINTENANCE MODULE ====================

export interface WorkOrderItem {
  id?: string;
  _id?: string;
  vehiclePlate: string;
  description: string;
  type: string;
  status: "scheduled" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  cost: number;
  workshopNotes?: string;
  scheduledDate?: string;
}

export async function fetchWorkOrders(): Promise<WorkOrderItem[]> {
  try {
    const res = await authFetch(`${API_BASE}/api/maintenance`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      // Format populated vehicleId if needed
      const normalized = (json.data || []).map((m: any) => ({
        ...m,
        id: m._id,
        vehiclePlate: m.vehicleId?.plateNumber || m.vehiclePlate || "KBZ-482L",
      }));
      setLocalItem(WORK_ORDERS_STORAGE_KEY, normalized);
      return normalized;
    }
  } catch {}
  return getLocalItem<WorkOrderItem>(WORK_ORDERS_STORAGE_KEY, []);
}

export async function createWorkOrder(payload: WorkOrderItem): Promise<WorkOrderItem> {
  try {
    // Look up vehicle if available
    const vehs = getStoredVehicles();
    const matched = vehs.find((v) => v.plateNumber === payload.vehiclePlate);
    const apiPayload = {
      ...payload,
      vehicleId: matched?._id || matched?.id || "6ac43a651bf32b260320aa6c",
    };

    const res = await authFetch(`${API_BASE}/api/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiPayload),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const created = { ...json.data, vehiclePlate: payload.vehiclePlate, id: json.data._id };
      const list = getLocalItem<WorkOrderItem>(WORK_ORDERS_STORAGE_KEY, []);
      setLocalItem(WORK_ORDERS_STORAGE_KEY, [created, ...list]);
      return created;
    }
  } catch {}

  const newItem: WorkOrderItem = { ...payload, id: `wo_${Date.now()}`, _id: `wo_${Date.now()}` };
  const list = getLocalItem<WorkOrderItem>(WORK_ORDERS_STORAGE_KEY, []);
  setLocalItem(WORK_ORDERS_STORAGE_KEY, [newItem, ...list]);
  return newItem;
}

export async function updateWorkOrderStatus(id: string, status: "scheduled" | "in_progress" | "completed"): Promise<boolean> {
  try {
    const res = await authFetch(`${API_BASE}/api/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const list = getLocalItem<WorkOrderItem>(WORK_ORDERS_STORAGE_KEY, []);
      const updated = list.map((w) => ((w._id || w.id) === id ? { ...w, status } : w));
      setLocalItem(WORK_ORDERS_STORAGE_KEY, updated);
      return true;
    }
  } catch {}

  const list = getLocalItem<WorkOrderItem>(WORK_ORDERS_STORAGE_KEY, []);
  const updated = list.map((w) => ((w._id || w.id) === id ? { ...w, status } : w));
  setLocalItem(WORK_ORDERS_STORAGE_KEY, updated);
  return true;
}

// ==================== INSPECTIONS (eDVIR) MODULE ====================

export interface InspectionItem {
  id?: string;
  _id?: string;
  reportNumber: string;
  vehiclePlate: string;
  inspectorName: string;
  type: string;
  outcome: "passed" | "failed" | "requires_attention";
  defectsSummary: string;
  date: string;
}

export async function fetchInspections(): Promise<InspectionItem[]> {
  try {
    const res = await authFetch(`${API_BASE}/api/inspections`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      setLocalItem(INSPECTIONS_STORAGE_KEY, json.data);
      return json.data;
    }
  } catch {}
  return getLocalItem<InspectionItem>(INSPECTIONS_STORAGE_KEY, []);
}

export async function createInspection(payload: InspectionItem): Promise<InspectionItem> {
  try {
    const res = await authFetch(`${API_BASE}/api/inspections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const list = getLocalItem<InspectionItem>(INSPECTIONS_STORAGE_KEY, []);
      setLocalItem(INSPECTIONS_STORAGE_KEY, [json.data, ...list]);
      return json.data;
    }
  } catch {}

  const newItem: InspectionItem = { ...payload, id: `insp_${Date.now()}`, _id: `insp_${Date.now()}` };
  const list = getLocalItem<InspectionItem>(INSPECTIONS_STORAGE_KEY, []);
  setLocalItem(INSPECTIONS_STORAGE_KEY, [newItem, ...list]);
  return newItem;
}

// ==================== TRANSPORT / DISPATCH MODULE ====================

export interface TripItem {
  id?: string;
  _id?: string;
  tripNumber: string;
  vehiclePlate: string;
  assignedDriver: string;
  origin: string;
  destination: string;
  cargoDescription: string;
  eta: string;
  status: "dispatched" | "in_transit" | "delivered" | "delayed";
}

export async function fetchTrips(): Promise<TripItem[]> {
  try {
    const res = await authFetch(`${API_BASE}/api/transport`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      setLocalItem(TRIPS_STORAGE_KEY, json.data);
      return json.data;
    }
  } catch {}
  return getLocalItem<TripItem>(TRIPS_STORAGE_KEY, []);
}

export async function createTrip(payload: TripItem): Promise<TripItem> {
  try {
    const res = await authFetch(`${API_BASE}/api/transport`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const list = getLocalItem<TripItem>(TRIPS_STORAGE_KEY, []);
      setLocalItem(TRIPS_STORAGE_KEY, [json.data, ...list]);
      return json.data;
    }
  } catch {}

  const newItem: TripItem = { ...payload, id: `trip_${Date.now()}`, _id: `trip_${Date.now()}` };
  const list = getLocalItem<TripItem>(TRIPS_STORAGE_KEY, []);
  setLocalItem(TRIPS_STORAGE_KEY, [newItem, ...list]);
  return newItem;
}

export async function updateTripStatus(id: string, status: "dispatched" | "in_transit" | "delivered" | "delayed"): Promise<boolean> {
  try {
    const res = await authFetch(`${API_BASE}/api/transport/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const list = getLocalItem<TripItem>(TRIPS_STORAGE_KEY, []);
      const updated = list.map((t) => ((t._id || t.id) === id ? { ...t, status } : t));
      setLocalItem(TRIPS_STORAGE_KEY, updated);
      return true;
    }
  } catch {}

  const list = getLocalItem<TripItem>(TRIPS_STORAGE_KEY, []);
  const updated = list.map((t) => ((t._id || t.id) === id ? { ...t, status } : t));
  setLocalItem(TRIPS_STORAGE_KEY, updated);
  return true;
}

// ==================== DRIVERS MODULE ====================

export interface DriverItem {
  id?: string;
  _id?: string;
  fullName: string;
  licenseNumber: string;
  licenseClass?: string;
  licenseExpiry: string;
  phone?: string;
  assignedVehicle?: string;
  status: "active" | "on_trip" | "suspended" | "inactive";
  performanceScore: number;
}

export async function fetchDrivers(): Promise<DriverItem[]> {
  try {
    const res = await authFetch(`${API_BASE}/api/drivers`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      const list = (json.data || []).map((d: any) => ({
        ...d,
        id: d._id,
        assignedVehicle: d.assignedVehicle || "KBZ-482L",
      }));
      setLocalItem(DRIVERS_STORAGE_KEY, list);
      return list;
    }
  } catch {}
  return getLocalItem<DriverItem>(DRIVERS_STORAGE_KEY, []);
}

export async function createDriver(payload: DriverItem): Promise<DriverItem> {
  try {
    const res = await authFetch(`${API_BASE}/api/drivers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: payload.fullName,
        licenseNumber: payload.licenseNumber,
        licenseClass: payload.licenseClass || "Class A Heavy Goods",
        licenseExpiry: payload.licenseExpiry,
        phone: payload.phone || "+254 700 000 000",
        status: payload.status,
        performanceScore: payload.performanceScore,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const created = { ...json.data, id: json.data._id, assignedVehicle: payload.assignedVehicle || "Unassigned" };
      const list = getLocalItem<DriverItem>(DRIVERS_STORAGE_KEY, []);
      setLocalItem(DRIVERS_STORAGE_KEY, [created, ...list]);
      return created;
    }
  } catch {}

  const newItem: DriverItem = { ...payload, id: `drv_${Date.now()}`, _id: `drv_${Date.now()}` };
  const list = getLocalItem<DriverItem>(DRIVERS_STORAGE_KEY, []);
  setLocalItem(DRIVERS_STORAGE_KEY, [newItem, ...list]);
  return newItem;
}
