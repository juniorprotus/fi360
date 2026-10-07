"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Vehicle, VehicleStatus, VehicleType } from "@/types/fleet";
import {
  fetchVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/lib/api";
import {
  Truck,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  PauseCircle,
  X,
  Loader2,
  Eye,
  Fuel,
  Gauge,
  Activity,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function FleetVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modal states
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    plateNumber: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    type: VehicleType;
    status: VehicleStatus;
    odometerKm: number;
    fuelLevelPercent: number;
    batteryVoltage: number;
    address: string;
  }>({
    plateNumber: "",
    vin: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    type: "truck",
    status: "active",
    odometerKm: 0,
    fuelLevelPercent: 100,
    batteryVoltage: 24.0,
    address: "Central Fleet Depot",
  });

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchVehicles();
      setVehicles(res.data);
    } catch {
      toast.error("Failed to load fleet vehicles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const openCreateModal = () => {
    setSelectedVehicle(null);
    setFormData({
      plateNumber: "",
      vin: `VIN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      make: "",
      model: "",
      year: new Date().getFullYear(),
      type: "truck",
      status: "active",
      odometerKm: 15000,
      fuelLevelPercent: 90,
      batteryVoltage: 24.2,
      address: "Terminal Bay 4",
    });
    setModalMode("create");
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      plateNumber: vehicle.plateNumber,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      type: vehicle.type,
      status: vehicle.status,
      odometerKm: vehicle.telematicsData?.odometerKm ?? 0,
      fuelLevelPercent: vehicle.telematicsData?.fuelLevelPercent ?? 100,
      batteryVoltage: vehicle.telematicsData?.batteryVoltage ?? 24.0,
      address: vehicle.telematicsData?.location?.address ?? "Fleet Depot",
    });
    setModalMode("edit");
  };

  const openViewModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setModalMode("view");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedVehicle(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plateNumber || !formData.make || !formData.model || !formData.vin) {
      toast.error("Please fill in plate number, VIN, make and model");
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const payload: Partial<Vehicle> = {
          plateNumber: formData.plateNumber.toUpperCase(),
          vin: formData.vin.toUpperCase(),
          make: formData.make,
          model: formData.model,
          year: Number(formData.year),
          type: formData.type,
          status: formData.status,
          telematicsData: {
            odometerKm: Number(formData.odometerKm),
            fuelLevelPercent: Number(formData.fuelLevelPercent),
            engineHours: Math.round(Number(formData.odometerKm) / 38),
            batteryVoltage: Number(formData.batteryVoltage),
            currentSpeedKmh: 0,
            location: {
              latitude: -1.286389,
              longitude: 36.817223,
              address: formData.address,
            },
          },
        };

        const created = await createVehicle(payload);
        setVehicles((prev) => [created, ...prev]);
        toast.success(`Vehicle ${created.plateNumber} successfully registered`);
        closeModal();
      } else if (modalMode === "edit" && selectedVehicle) {
        const id = selectedVehicle._id || selectedVehicle.id || "";
        const payload: Partial<Vehicle> = {
          plateNumber: formData.plateNumber.toUpperCase(),
          vin: formData.vin.toUpperCase(),
          make: formData.make,
          model: formData.model,
          year: Number(formData.year),
          type: formData.type,
          status: formData.status,
          telematicsData: {
            odometerKm: Number(formData.odometerKm),
            fuelLevelPercent: Number(formData.fuelLevelPercent),
            engineHours: selectedVehicle.telematicsData?.engineHours ?? 1000,
            batteryVoltage: Number(formData.batteryVoltage),
            currentSpeedKmh: selectedVehicle.telematicsData?.currentSpeedKmh ?? 0,
            location: {
              latitude: selectedVehicle.telematicsData?.location?.latitude ?? -1.286389,
              longitude: selectedVehicle.telematicsData?.location?.longitude ?? 36.817223,
              address: formData.address,
            },
          },
        };

        const updated = await updateVehicle(id, payload);
        if (updated) {
          setVehicles((prev) =>
            prev.map((v) => ((v._id || v.id) === id ? updated : v))
          );
          toast.success(`Vehicle ${updated.plateNumber} updated successfully`);
        }
        closeModal();
      }
    } catch (err) {
      console.error(err);
      toast.error("Operation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (vehicle: Vehicle, newStatus: VehicleStatus) => {
    const id = vehicle._id || vehicle.id || "";
    try {
      const updated = await updateVehicle(id, { status: newStatus });
      if (updated) {
        setVehicles((prev) =>
          prev.map((v) => ((v._id || v.id) === id ? updated : v))
        );
        toast.success(`Status of ${vehicle.plateNumber} changed to ${newStatus}`);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteVehicle(id);
      if (success) {
        setVehicles((prev) => prev.filter((v) => (v._id || v.id) !== id));
        toast.success("Vehicle deleted from registry");
      }
    } catch {
      toast.error("Failed to delete vehicle");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            Active (On-Road)
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30">
            <Wrench className="h-3 w-3" />
            In Workshop
          </span>
        );
      case "critical_failure":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 animate-pulse">
            <ShieldAlert className="h-3 w-3" />
            Critical Fault
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <PauseCircle className="h-3 w-3" />
            Inactive / Reserve
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Vehicles &amp; Asset Management
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Module 1
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete vehicle lifecycle control, telematics telemetry, service status, and asset records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadVehicles}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plate, VIN, make, model..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Statuses ({vehicles.length})</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="critical_failure">Critical Fault</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Types</option>
              <option value="truck">Truck</option>
              <option value="heavy_duty">Heavy Duty</option>
              <option value="van">Van</option>
              <option value="pickup">Pickup</option>
              <option value="trailer">Trailer</option>
              <option value="forklift">Forklift</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table / Empty State */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Vehicle / Identity</th>
                <th className="px-4 py-3.5">Type &amp; Year</th>
                <th className="px-4 py-3.5">Operational Status</th>
                <th className="px-4 py-3.5">Odometer &amp; Fuel</th>
                <th className="px-4 py-3.5">Current Location</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span>Loading fleet vehicles...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                        <Truck className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        No Vehicles Found
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                        {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                          ? "No vehicles match the active search and filter criteria."
                          : "Get started by registering your first asset into the fleet database."}
                      </p>
                      <button
                        onClick={openCreateModal}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2"
                      >
                        Register First Vehicle
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const id = v._id || v.id || v.vin;
                  return (
                    <tr
                      key={id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shrink-0">
                            {v.plateNumber.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {v.plateNumber}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              VIN: {v.vin}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                          {v.make} {v.model}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {v.year} &bull; <span className="capitalize">{v.type}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(v.status)}
                          {/* Fast Status Switch Dropdown */}
                          <select
                            value={v.status}
                            onChange={(e) =>
                              handleQuickStatusChange(v, e.target.value as VehicleStatus)
                            }
                            title="Quick Change Status"
                            aria-label={`Change status for ${v.plateNumber}`}
                            className="text-[10px] bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                          >
                            <option value="active">Active</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="critical_failure">Fault</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono text-slate-900 dark:text-white font-medium">
                          {(v.telematicsData?.odometerKm ?? 0).toLocaleString()} km
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <Fuel className="h-3 w-3 text-cyan-500" />
                          <span>{v.telematicsData?.fuelLevelPercent ?? 0}% Fuel</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                        {v.telematicsData?.location?.address || "Depot Logistics Hub"}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openViewModal(v)}
                            title="Inspect Vehicle Telemetry"
                            aria-label={`Inspect ${v.plateNumber}`}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(v)}
                            title="Edit Vehicle"
                            aria-label={`Edit ${v.plateNumber}`}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-blue-600 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-slate-800 transition"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(id)}
                            title="Delete Vehicle"
                            aria-label={`Delete ${v.plateNumber}`}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal Dialog */}
      {(modalMode === "create" || modalMode === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {modalMode === "create" ? "Register New Fleet Vehicle" : `Edit Vehicle (${formData.plateNumber})`}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    placeholder="KBZ-482L"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    VIN (17 Characters) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    placeholder="1HD1KAE11FB012345"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Make *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    placeholder="Mercedes-Benz"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Actros 2645"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    required
                    min={1990}
                    max={2030}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Asset Class / Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as VehicleType })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="truck">Truck</option>
                    <option value="heavy_duty">Heavy Duty Prime Mover</option>
                    <option value="van">Van</option>
                    <option value="pickup">Pickup</option>
                    <option value="trailer">Trailer</option>
                    <option value="forklift">Forklift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="active">Active (On-Road)</option>
                    <option value="maintenance">In Workshop</option>
                    <option value="critical_failure">Critical Fault</option>
                    <option value="inactive">Inactive / Reserve</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.odometerKm}
                    onChange={(e) => setFormData({ ...formData, odometerKm: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fuel Level (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.fuelLevelPercent}
                    onChange={(e) => setFormData({ ...formData, fuelLevelPercent: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Battery (V)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.batteryVoltage}
                    onChange={(e) => setFormData({ ...formData, batteryVoltage: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Assigned Terminal
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Mombasa Corridor Depot, Gate 3"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{modalMode === "create" ? "Save & Register Vehicle" : "Update Vehicle"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspection View Modal */}
      {modalMode === "view" && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  {selectedVehicle.plateNumber.slice(0, 3)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedVehicle.plateNumber}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400">VIN:</span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedVehicle.vin}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Current Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedVehicle.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Odometer:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {(selectedVehicle.telematicsData?.odometerKm ?? 0).toLocaleString()} km
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Fuel Level:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedVehicle.telematicsData?.fuelLevelPercent ?? 0}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Battery Voltage:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedVehicle.telematicsData?.batteryVoltage?.toFixed(1) ?? "24.0"}V
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Engine Hours:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedVehicle.telematicsData?.engineHours ?? 0} hrs
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Assigned Location:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {selectedVehicle.telematicsData?.location?.address || "Central Depot Hub"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                onClick={() => {
                  closeModal();
                  openEditModal(selectedVehicle);
                }}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2"
              >
                Edit Vehicle Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <AlertCircle className="h-6 w-6" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Delete Vehicle from Fleet?
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              This action permanently removes the vehicle from the active registry and connected telematics logs.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 text-xs font-semibold shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
