"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wrench,
  Plus,
  Loader2,
  X,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchWorkOrders,
  fetchWorkshopVehicles,
  createWorkOrder,
  updateWorkOrderStatus,
  CreateWorkOrderInput,
  WorkOrderItem,
} from "@/lib/api";
import type { Vehicle } from "@/types/fleet";

const MAINTENANCE_TYPES = [
  { value: "inspection", label: "Inspection" },
  { value: "oil_service", label: "Oil Service" },
  { value: "brake_system", label: "Brake System" },
  { value: "tyre_rotation", label: "Tyre Rotation" },
  { value: "engine_overhaul", label: "Engine Overhaul" },
  { value: "electrical", label: "Electrical" },
  { value: "emergency_repair", label: "Emergency Repair" },
] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

function hasRecordedCost(order: WorkOrderItem): order is WorkOrderItem & { cost: number } {
  return typeof order.cost === "number" && (order.costRecorded === true || order.cost > 0);
}

export default function WorkshopDashboardPage() {
  const [orders, setOrders] = useState<WorkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateWorkOrderInput>({
    vehicleId: "",
    description: "",
    type: "inspection",
    status: "scheduled",
    priority: "medium",
    workshopNotes: "",
    scheduledDate: new Date().toISOString().substring(0, 10),
  });

  const loadData = useCallback(async () => {
    try {
      const data = await fetchWorkOrders();
      setOrders(data);
    } catch {
      toast.error("Failed to load workshop work orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchWorkOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch(() => {
        if (active) toast.error("Failed to load workshop work orders");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSync = () => {
    setLoading(true);
    void loadData();
  };

  const openCreateModal = async () => {
    setFormData({
      vehicleId: "",
      description: "",
      type: "inspection",
      status: "scheduled",
      priority: "medium",
      workshopNotes: "",
      scheduledDate: new Date().toISOString().substring(0, 10),
    });
    setIsModalOpen(true);
    setVehiclesLoading(true);
    try {
      setVehicles(await fetchWorkshopVehicles());
    } catch (error) {
      setVehicles([]);
      toast.error(error instanceof Error ? error.message : "Failed to load organization vehicles");
    } finally {
      setVehiclesLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.vehicleId) {
      toast.error("Please select a vehicle and enter a repair description");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createWorkOrder(formData);
      setOrders((prev) => [created, ...prev]);
      toast.success(`Work order for ${created.vehiclePlate || "selected vehicle"} registered`);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create work order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "scheduled" | "in_progress" | "completed") => {
    try {
      const updated = await updateWorkOrderStatus(id, newStatus);
      setOrders((prev) => prev.map((order) => ((order._id || order.id) === id ? updated : order)));
      toast.success(`Work order status transitioned to ${updated.status.replace("_", " ")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update work order status");
    }
  };

  const filteredOrders = orders.filter((o) => filter === "all" || o.status === filter);
  const recordedCosts = orders.filter(hasRecordedCost);
  const totalRecordedCost = recordedCosts.reduce((total, order) => total + (order.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Workshop &amp; Maintenance Command
            </h1>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Module 3
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Work order lifecycle, preventive maintenance (PM) queues, and technician task dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Work Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Scheduled Jobs</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {orders.filter((o) => o.status === "scheduled").length}
          </div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Awaiting workshop bay</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">In Progress (Bays Active)</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {orders.filter((o) => o.status === "in_progress").length}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Technicians working</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completed Repairs</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {orders.filter((o) => o.status === "completed").length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Returned to operational service</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Recorded Maintenance Cost</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {recordedCosts.length
              ? `$${totalRecordedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "Not recorded"}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Orders pending estimates are excluded</span>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        {(["all", "scheduled", "in_progress", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`pb-3 px-4 capitalize transition border-b-2 -mb-px ${
              filter === tab
                ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.replace("_", " ")} ({orders.filter((o) => tab === "all" || o.status === tab).length})
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
            <p className="text-xs">Loading workshop job cards...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            <Wrench className="h-10 w-10 text-amber-600 mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Work Orders Found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">No jobs currently match this status filter.</p>
            <button
              onClick={openCreateModal}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2"
            >
              Create New Job Card
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const id = order._id || order.id || "";
            return (
              <div
                key={id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                  {order.vehiclePlate || "Vehicle unavailable"}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {order.description}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          order.priority === "urgent"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : order.priority === "high"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {order.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {order.workshopNotes || "Inspection in progress."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {hasRecordedCost(order)
                          ? `$${order.cost.toFixed(2)}`
                          : "Pending estimate"}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {order.status.replace("_", " ")}
                      </div>
                    </div>

                    {order.status !== "completed" && (
                      <div className="flex items-center gap-1.5">
                        {order.status === "scheduled" && (
                          <button
                            onClick={() => handleStatusChange(id, "in_progress")}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
                          >
                            Start Job
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(id, "completed")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                        >
                          Mark Completed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Wrench className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Create Workshop Work Order
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle *
                  </label>
                  <select
                    required
                    value={formData.vehicleId}
                    onChange={(event) => setFormData({ ...formData, vehicleId: event.target.value })}
                    disabled={vehiclesLoading || vehicles.length === 0}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">
                      {vehiclesLoading ? "Loading vehicles..." : vehicles.length ? "Select a vehicle" : "No vehicles available"}
                    </option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.plateNumber} - {[vehicle.make, vehicle.model].filter(Boolean).join(" ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(event) => {
                      const priority = PRIORITIES.find((value) => value === event.target.value);
                      if (priority) setFormData({ ...formData, priority });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority === "urgent" ? "Urgent (Road Break-Down)" : priority[0].toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task / Repair Description *
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Maintenance Category
                  </label>
                  <select
                    value={formData.type}
                    onChange={(event) => {
                      const selectedType = MAINTENANCE_TYPES.find(({ value }) => value === event.target.value);
                      if (selectedType) setFormData({ ...formData, type: selectedType.value });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {MAINTENANCE_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cost ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      cost: e.target.value === "" ? undefined : Number(e.target.value),
                    })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Workshop Technician Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.workshopNotes}
                  onChange={(e) => setFormData({ ...formData, workshopNotes: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || vehiclesLoading || vehicles.length === 0}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Dispatch Job Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
