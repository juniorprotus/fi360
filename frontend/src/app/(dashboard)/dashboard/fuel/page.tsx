"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Fuel, Plus, TrendingDown, DollarSign, Calendar, Search, Trash2, Loader2, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fetchFuelLogs, createFuelLog, FuelItem } from "@/lib/api";

export default function FuelManagementPage() {
  const [logs, setLogs] = useState<FuelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<FuelItem>({
    receiptNumber: "",
    vehiclePlate: "KBZ-482L",
    litres: 250,
    costTotal: 350,
    odometerKm: 48500,
    station: "TotalEnergies Athi River Superstation",
    date: new Date().toISOString().replace("T", " ").substring(0, 16),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFuelLogs();
      setLogs(data);
    } catch {
      toast.error("Failed to load fuel transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setFormData({
      receiptNumber: `TX-FUEL-${Math.floor(1000 + Math.random() * 9000)}`,
      vehiclePlate: "KBZ-482L",
      litres: 280,
      costTotal: 392,
      odometerKm: 48900,
      station: "Rubis Nakuru Interchange",
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.receiptNumber || !formData.vehiclePlate || !formData.litres || !formData.costTotal) {
      toast.error("Please fill in receipt number, vehicle plate, fuel volume and cost");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createFuelLog(formData);
      setLogs((prev) => [created, ...prev]);
      toast.success(`Fuel receipt ${created.receiptNumber} recorded successfully`);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to record fuel fill-up");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = logs.filter((f) => {
    return (
      f.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.station.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalLitres = logs.reduce((sum, l) => sum + Number(l.litres || 0), 0);
  const totalSpend = logs.reduce((sum, l) => sum + Number(l.costTotal || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Fuel &amp; Energy Intelligence
            </h1>
            <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              Module 5
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fuel card transactions, consumption anomalies, dispensing station audit, and fuel expenditure telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Fill-Up</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Volume Dispensed</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalLitres.toLocaleString()} L
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Logged across all active corridors</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Fuel Expenditure</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">Average ${(totalSpend / (totalLitres || 1)).toFixed(2)}/L</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fill-Up Transactions</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {logs.length}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Fully reconciled records</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search receipt, vehicle plate, station..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Receipt / Ref</th>
              <th className="px-4 py-3">Vehicle Plate</th>
              <th className="px-4 py-3">Fuel Volume</th>
              <th className="px-4 py-3">Cost Total</th>
              <th className="px-4 py-3">Odometer</th>
              <th className="px-4 py-3">Dispensing Station</th>
              <th className="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
                    <span>Loading fuel ledger...</span>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
                      <Fuel className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      No Fuel Logs Found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                      {searchTerm
                        ? "No fuel receipts match your search query."
                        : "Log your first fuel dispensation to start tracking consumption anomalies."}
                    </p>
                    <button
                      onClick={openCreateModal}
                      className="rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold px-4 py-2"
                    >
                      Log First Fill-Up
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((f) => {
                const id = f._id || f.id || f.receiptNumber;
                return (
                  <tr key={id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {f.receiptNumber}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400">
                      {f.vehiclePlate}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {f.litres} L
                    </td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ${Number(f.costTotal).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {Number(f.odometerKm).toLocaleString()} km
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      {f.station}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {f.date}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Log Fuel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                  <Fuel className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Log Fuel Transaction
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt / Ref Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.receiptNumber}
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Volume (Litres) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formData.litres}
                    onChange={(e) => setFormData({ ...formData, litres: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={formData.costTotal}
                    onChange={(e) => setFormData({ ...formData, costTotal: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.odometerKm}
                    onChange={(e) => setFormData({ ...formData, odometerKm: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dispensing Station / Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.station}
                  onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Fuel Transaction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
