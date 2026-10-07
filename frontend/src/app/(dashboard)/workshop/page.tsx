"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Wrench,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Truck,
  ArrowRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface WorkOrder {
  id: string;
  orderNumber: string;
  vehiclePlate: string;
  vehicleModel: string;
  issue: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "pending_parts" | "completed";
  assignedTechnician: string;
  dueDate: string;
}

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: "wo_101",
    orderNumber: "WO-2026-089",
    vehiclePlate: "KDD-109X",
    vehicleModel: "Isuzu FRR 90",
    issue: "Hydraulic lift cylinder seal leakage & differential oil renewal",
    priority: "high",
    status: "in_progress",
    assignedTechnician: "James Wachira (Master Tech)",
    dueDate: "2026-10-09",
  },
  {
    id: "wo_102",
    orderNumber: "WO-2026-090",
    vehiclePlate: "KDA-553M",
    vehicleModel: "Toyota Hilux D-4D",
    issue: "Alternator low voltage failure & battery replacement",
    priority: "critical",
    status: "open",
    assignedTechnician: "David Mwangi",
    dueDate: "2026-10-08",
  },
  {
    id: "wo_103",
    orderNumber: "WO-2026-084",
    vehiclePlate: "KBZ-482L",
    vehicleModel: "Mercedes Actros 2645",
    issue: "50,000 km Scheduled Preventive Maintenance (PM B)",
    priority: "medium",
    status: "completed",
    assignedTechnician: "James Wachira (Master Tech)",
    dueDate: "2026-10-05",
  },
];

export default function WorkshopDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [filter, setFilter] = useState<string>("all");

  const filteredOrders = orders.filter((o) => filter === "all" || o.status === filter);

  const handleStatusChange = (id: string, newStatus: WorkOrder["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
    toast.success("Work Order status updated");
  };

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

        <button
          onClick={() => toast.info("New Work Order modal available in full module view")}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Work Order</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Open Jobs</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {orders.filter((o) => o.status === "open").length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">In Bay (Active)</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {orders.filter((o) => o.status === "in_progress").length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Critical Priority</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {orders.filter((o) => o.priority === "critical").length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completed This Week</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {orders.filter((o) => o.status === "completed").length}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 w-fit">
        {["all", "open", "in_progress", "completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition ${
              filter === tab
                ? "bg-amber-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Work Order #</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Service Defect / Description</th>
              <th className="px-4 py-3">Assigned Tech</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                  {order.orderNumber}
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-900 dark:text-white">{order.vehiclePlate}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{order.vehicleModel}</div>
                </td>
                <td className="px-4 py-3.5 max-w-xs text-slate-700 dark:text-slate-300">
                  {order.issue}
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                  {order.assignedTechnician}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      order.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : order.status === "in_progress"
                        ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400"
                        : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400"
                    }`}
                  >
                    {order.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  {order.status !== "completed" ? (
                    <button
                      onClick={() => handleStatusChange(order.id, "completed")}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      Mark Done
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs">Closed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
