"use client";

import React from "react";
import { Shield, Key, Users, Lock, CheckCircle2 } from "lucide-react";

export default function AdminModulePage() {
  const auditLogs = [
    { action: "Role Changed: david@metrologistics.com to technician", user: "Alex Sterling (Admin)", time: "10 mins ago" },
    { action: "Asset KBZ-482L Status updated to active", user: "Daniel Ochieng (Driver)", time: "25 mins ago" },
    { action: "Work Order WO-2026-089 Assigned to James Wachira", user: "Alex Sterling (Admin)", time: "1 hour ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
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

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Recent Security &amp; Mutation Audit Trail</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {auditLogs.map((log, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                <div className="text-[11px] text-slate-400 mt-0.5">Triggered by {log.user}</div>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
