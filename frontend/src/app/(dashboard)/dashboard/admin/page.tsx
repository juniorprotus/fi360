"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Users,
  Lock,
  CheckCircle2,
  Plus,
  UserCheck,
  Download,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { UserRole, ROLE_CONFIGS } from "@/lib/auth/rbac";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: "active" | "suspended";
  lastActive: string;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  { id: "tm_1", name: "Alex Sterling", email: "alex@metrologistics.com", role: "owner", department: "Executive Leadership", status: "active", lastActive: "Just now" },
  { id: "tm_2", name: "Daniel Ochieng", email: "daniel@metrologistics.com", role: "fleet_manager", department: "Operations", status: "active", lastActive: "12m ago" },
  { id: "tm_3", name: "James Wachira", email: "james@metrologistics.com", role: "workshop_manager", department: "Workshop & Maintenance", status: "active", lastActive: "45m ago" },
  { id: "tm_4", name: "Peter Ochieng", email: "peter@metrologistics.com", role: "technician", department: "Workshop Bay 2", status: "active", lastActive: "2h ago" },
  { id: "tm_5", name: "John Maina", email: "john@metrologistics.com", role: "driver", department: "Haulage Fleet", status: "active", lastActive: "5m ago" },
  { id: "tm_6", name: "Samuel Karanja", email: "samuel@metrologistics.com", role: "compliance", department: "Safety & Legal", status: "active", lastActive: "1h ago" },
];

const ADMIN_STORAGE_KEY = "fi360_persisted_team_members";
const AUDIT_STORAGE_KEY = "fi360_persisted_audit_logs";

export default function AdminModulePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; user: string; time: string }[]>([]);

  // Security Toggles
  const [enforceMfa, setEnforceMfa] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [ipRestricted, setIpRestricted] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<{ name: string; email: string; role: UserRole; department: string }>({
    name: "",
    email: "",
    role: "fleet_manager",
    department: "Operations",
  });

  useEffect(() => {
    try {
      const storedM = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (storedM) setMembers(JSON.parse(storedM));
      else {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(DEFAULT_MEMBERS));
        setMembers(DEFAULT_MEMBERS);
      }

      const storedA = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (storedA) setAuditLogs(JSON.parse(storedA));
      else {
        const initialLogs = [
          { id: "l_1", action: "Tenant Security Policy initialized: MFA Enforced", user: "Alex Sterling (Owner)", time: "10 mins ago" },
          { id: "l_2", action: "Vehicle KBZ-482L assigned to John Maina", user: "Daniel Ochieng (Fleet Manager)", time: "25 mins ago" },
          { id: "l_3", action: "Work Order WO-2026-089 approved for bay 3", user: "James Wachira (Workshop Lead)", time: "1 hour ago" },
        ];
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initialLogs));
        setAuditLogs(initialLogs);
      }
    } catch {}
  }, []);

  const saveMembers = (newMembers: TeamMember[]) => {
    setMembers(newMembers);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(newMembers));
    } catch {}
  };

  const addAuditLog = (action: string) => {
    const newLog = {
      id: `l_${Date.now()}`,
      action,
      user: "Alex Sterling (Admin)",
      time: "Just now",
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please enter both member name and work email");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const newMember: TeamMember = {
        id: `tm_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        status: "active",
        lastActive: "Never logged in",
      };
      const updated = [newMember, ...members];
      saveMembers(updated);
      addAuditLog(`Invited new team member: ${formData.email} as ${ROLE_CONFIGS[formData.role].label}`);
      toast.success(`Invitation sent to ${formData.email} with ${ROLE_CONFIGS[formData.role].label} permissions`);
      setSubmitting(false);
      setIsModalOpen(false);
      setFormData({ name: "", email: "", role: "fleet_manager", department: "Operations" });
    }, 300);
  };

  const handleRoleChange = (id: string, newRole: UserRole) => {
    const updated = members.map((m) => (m.id === id ? { ...m, role: newRole } : m));
    saveMembers(updated);
    const target = members.find((m) => m.id === id);
    addAuditLog(`Role Changed: ${target?.email} reallocated to ${ROLE_CONFIGS[newRole].label}`);
    toast.success(`Role updated to ${ROLE_CONFIGS[newRole].label}`);
  };

  const handleStatusToggle = (id: string) => {
    const updated = members.map((m) => {
      if (m.id === id) {
        const nextStatus: "active" | "suspended" = m.status === "active" ? "suspended" : "active";
        addAuditLog(`Account ${m.email} set to ${nextStatus}`);
        toast.success(`User ${m.name} is now ${nextStatus}`);
        return { ...m, status: nextStatus };
      }
      return m;
    });
    saveMembers(updated);
  };

  const handleSaveSecurityPolicy = () => {
    addAuditLog(`Updated Security Policy: MFA=${enforceMfa}, Timeout=${sessionTimeout}, IP_Lock=${ipRestricted}`);
    toast.success("Security & Multi-Tenant Access Policies saved successfully");
  };

  const handleExportAuditLogs = () => {
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fi360-audit-trail-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit trail log downloaded (JSON)");
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
    try {
      localStorage.removeItem(AUDIT_STORAGE_KEY);
    } catch {}
    toast.success("Audit trail logs purged");
  };

  const allRoles: UserRole[] = [
    "owner",
    "admin",
    "fleet_manager",
    "workshop_manager",
    "technician",
    "driver",
    "dispatcher",
    "compliance",
    "finance",
    "viewer",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Administration, Tenancy &amp; Security (RBAC)
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Module 11
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Multi-tenant isolation policies, role assignments, SAML SSO, and immutable audit logs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Security Policies Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Organization Access Control Policies
            </h3>
          </div>
          <button
            onClick={handleSaveSecurityPolicy}
            className="rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition"
          >
            Apply Policy
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">Enforce Multi-Factor (MFA)</div>
              <div className="text-[11px] text-slate-400">Require TOTP code on login</div>
            </div>
            <input
              type="checkbox"
              checked={enforceMfa}
              onChange={(e) => setEnforceMfa(e.target.checked)}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">Idle Session Expiration</div>
              <div className="text-[11px] text-slate-400">Auto sign-out after 30 min</div>
            </div>
            <input
              type="checkbox"
              checked={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.checked)}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">Strict IP Whitelist</div>
              <div className="text-[11px] text-slate-400">Lock access to depot subnets</div>
            </div>
            <input
              type="checkbox"
              checked={ipRestricted}
              onChange={(e) => setIpRestricted(e.target.checked)}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Team Directory Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Authorized Personnel &amp; RBAC Roles ({members.length})
          </h3>
          <span className="text-xs text-slate-400">10 Dedicated Commercial Role Profiles</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">User / Identity</th>
              <th className="px-4 py-3">Assigned RBAC Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {members.map((m) => (
              <tr key={m.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3.5">
                  <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                </td>
                <td className="px-4 py-3.5">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-400"
                  >
                    {allRoles.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_CONFIGS[r].label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                  {m.department}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      m.status === "active"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                    }`}
                  >
                    {m.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                  {m.lastActive}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={() => handleStatusToggle(m.id)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 underline"
                  >
                    {m.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit Log Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Immutable Mutation &amp; Security Audit Trail
            </h3>
            <p className="text-xs text-slate-400">Timestamped record of administrative actions and role transitions.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAuditLogs}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleClearAuditLogs}
              className="flex items-center gap-1 rounded-md border border-rose-200 text-rose-600 px-2.5 py-1 text-xs font-medium hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Purge</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No audit log entries recorded.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">Authorized by {log.user}</div>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">{log.time}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Invite Team Member</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Grace Wanjiku"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="grace@metrologistics.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Commercial Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {allRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIGS[r].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Workshop Hub"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
