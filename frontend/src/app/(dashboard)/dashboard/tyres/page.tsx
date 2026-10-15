"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Disc, Plus, AlertTriangle, CheckCircle2, RotateCw, Search, Trash2, Gauge, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchTyres, createTyre, updateTyre, deleteTyre, TyreItem } from "@/lib/api";

export default function TyreManagementPage() {
  const [tyres, setTyres] = useState<TyreItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    serialNumber: string;
    vehiclePlate: string;
    position: string;
    brand: string;
    treadDepthMm: number;
    pressurePsi: number;
    status: "good" | "warning" | "critical_wear";
  }>({
    serialNumber: "",
    vehiclePlate: "KBZ-482L",
    position: "Steer Axle - Front Left",
    brand: "Michelin X Multiway 315/80R22.5",
    treadDepthMm: 14.0,
    pressurePsi: 120,
    status: "good",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTyres();
      setTyres(data);
    } catch {
      toast.error("Failed to load tyre registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setFormData({
      serialNumber: `TY-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      vehiclePlate: "KBZ-482L",
      position: "Drive Axle - Front Outer",
      brand: "Bridgestone M729 315/80R22.5",
      treadDepthMm: 13.5,
      pressurePsi: 115,
      status: "good",
    });
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serialNumber || !formData.vehiclePlate || !formData.brand) {
      toast.error("Please fill in serial number, vehicle plate, and brand");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createTyre(formData);
      setTyres((prev) => [created, ...prev]);
      toast.success(`Tyre ${created.serialNumber} registered & mounted`);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to register tyre");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickPressureCheck = async (tyre: TyreItem) => {
    const id = tyre._id || tyre.id || "";
    const newPressure = Math.min(125, tyre.pressurePsi + 5);
    try {
      const updated = await updateTyre(id, { pressurePsi: newPressure });
      if (updated) {
        setTyres((prev) => prev.map((t) => ((t._id || t.id) === id ? updated : t)));
        toast.success(`Tyre ${tyre.serialNumber} inflated to ${newPressure} PSI`);
      }
    } catch {
      toast.error("Failed to update tyre pressure");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteTyre(id);
      if (success) {
        setTyres((prev) => prev.filter((t) => (t._id || t.id) !== id));
        toast.success("Tyre dismounted and removed from asset registry");
      }
    } catch {
      toast.error("Failed to delete tyre");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filteredTyres = tyres.filter((t) => {
    const matchesSearch =
      t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tyre Management &amp; Tread Life
            </h1>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              Module 4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Axle configuration mapping, tread depth wear inspection, pressure monitoring, and retread tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Mount / Register Tyre</span>
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
            placeholder="Search serial, plate, position, brand..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Condition:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="all">All Conditions ({tyres.length})</option>
            <option value="good">Good Condition</option>
            <option value="warning">Wear Warning (&lt;4mm)</option>
            <option value="critical_wear">Critical Wear</option>
          </select>
        </div>
      </div>

      {/* Tyres Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Serial Number / Brand</th>
              <th className="px-4 py-3">Vehicle Plate</th>
              <th className="px-4 py-3">Axle Position</th>
              <th className="px-4 py-3">Tread Depth</th>
              <th className="px-4 py-3">Pressure</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                    <span>Loading tyre telemetry...</span>
                  </div>
                </td>
              </tr>
            ) : filteredTyres.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3">
                      <Disc className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      No Tyres Found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                      {searchTerm || statusFilter !== "all"
                        ? "No tyres match the active search and filter criteria."
                        : "Start monitoring tread life by registering your first mounted tyre."}
                    </p>
                    <button
                      onClick={openCreateModal}
                      className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2"
                    >
                      Mount First Tyre
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTyres.map((t) => {
                const id = t._id || t.id || t.serialNumber;
                return (
                  <tr key={id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{t.serialNumber}</div>
                      <div className="text-[11px] text-slate-500">{t.brand}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400">
                      {t.vehiclePlate}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      {t.position}
                    </td>
                    <td className="px-4 py-3.5 font-bold">
                      {t.treadDepthMm} mm
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      {t.pressurePsi} PSI
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          t.status === "good"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : t.status === "warning"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}
                      >
                        {t.status === "good" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleQuickPressureCheck(t)}
                          title="Inflate / Calibrate Pressure"
                          className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Gauge className="h-3 w-3 text-violet-600" />
                          <span>Calibrate</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(id)}
                          title="Dismount tyre"
                          className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
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

      {/* Mount Tyre Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                  <Disc className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Mount / Register Tyre
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
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand &amp; Dimension *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Axle Position *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Steer Axle - Front Left">Steer Axle - Front Left</option>
                    <option value="Steer Axle - Front Right">Steer Axle - Front Right</option>
                    <option value="Drive Axle - Front Outer Left">Drive Axle - Front Outer Left</option>
                    <option value="Drive Axle - Front Outer Right">Drive Axle - Front Outer Right</option>
                    <option value="Drive Axle - Rear Outer Right">Drive Axle - Rear Outer Right</option>
                    <option value="Trailer Axle 1 - Outer">Trailer Axle 1 - Outer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tread Depth (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.treadDepthMm}
                    onChange={(e) => setFormData({ ...formData, treadDepthMm: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pressure (PSI)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pressurePsi}
                    onChange={(e) => setFormData({ ...formData, pressurePsi: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="good">Good</option>
                    <option value="warning">Warning (&lt;4mm)</option>
                    <option value="critical_wear">Critical Wear</option>
                  </select>
                </div>
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
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Mount &amp; Persist Tyre</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Dismount &amp; Delete Tyre?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
              This will remove the tyre from asset registry and axle telemetry records.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
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
