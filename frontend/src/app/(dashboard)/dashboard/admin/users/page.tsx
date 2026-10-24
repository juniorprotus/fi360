"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  UserCog,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_CONFIGS, UserRole } from "@/lib/auth/rbac";
import {
  ApiRequestError,
  createOrganizationUser,
  fetchOrganizationUsers,
  OrganizationUser,
  updateOrganizationUserRole,
  updateOrganizationUserStatus,
} from "@/lib/api";

const ADMINISTRATIVE_ROLES: UserRole[] = ["owner", "admin"];

const inputClassName =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function describeRequestError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session has expired. Sign in again to continue.";
    if (error.status === 403) return "You do not have permission to manage organization employees.";
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : "The request could not be completed. Please try again.";
}

export default function EmployeeManagementPage() {
  const { user, refreshSession } = useAuth();
  const [employees, setEmployees] = useState<OrganizationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingEmployeeId, setPendingEmployeeId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "fleet_manager" as UserRole,
  });

  const canManageUsers = user?.role === "owner" || user?.role === "admin";
  const availableRoles = useMemo(() => {
    const roles = Object.keys(ROLE_CONFIGS) as UserRole[];
    return user?.role === "owner"
      ? roles
      : roles.filter((role) => !ADMINISTRATIVE_ROLES.includes(role));
  }, [user?.role]);

  const loadEmployees = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    setLoadError(null);

    try {
      const data = await fetchOrganizationUsers();
      setEmployees(data);
    } catch (error) {
      const message = describeRequestError(error);
      setLoadError(message);
      if (error instanceof ApiRequestError && error.status === 401) {
        void refreshSession();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSession]);

  useEffect(() => {
    if (!canManageUsers) return;

    let isCurrent = true;
    fetchOrganizationUsers()
      .then((data) => {
        if (!isCurrent) return;
        setEmployees(data);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setLoadError(describeRequestError(error));
        if (error instanceof ApiRequestError && error.status === 401) {
          void refreshSession();
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [canManageUsers, refreshSession]);

  const handleCreateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageUsers || isCreating) return;

    setIsCreating(true);
    try {
      await createOrganizationUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      toast.success("Employee account created successfully.");
      setForm({ name: "", email: "", password: "", role: "fleet_manager" });
      setIsFormOpen(false);
      await loadEmployees(true);
    } catch (error) {
      const message = describeRequestError(error);
      toast.error(
        error instanceof ApiRequestError && error.status === 409
          ? "That work email is already registered. Use a different email address."
          : message
      );
      if (error instanceof ApiRequestError && error.status === 401) {
        void refreshSession();
      }
    } finally {
      setForm((current) => ({ ...current, password: "" }));
      setIsCreating(false);
    }
  };

  const handleRoleChange = async (employee: OrganizationUser, role: UserRole) => {
    if (pendingEmployeeId || employee.role === role) return;
    setPendingEmployeeId(employee.id);

    try {
      const updated = await updateOrganizationUserRole(employee.id, role);
      setEmployees((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success(`Role updated to ${ROLE_CONFIGS[updated.role].label}.`);
      await loadEmployees(true);
    } catch (error) {
      toast.error(describeRequestError(error));
      if (error instanceof ApiRequestError && error.status === 401) {
        void refreshSession();
      }
    } finally {
      setPendingEmployeeId(null);
    }
  };

  const handleStatusChange = async (employee: OrganizationUser) => {
    const nextStatus = employee.status === "active" ? "suspended" : "active";
    if (
      pendingEmployeeId ||
      employee.role === "owner" ||
      (employee.role === "admin" && user?.role !== "owner") ||
      (employee.id === user?.id && nextStatus === "suspended")
    ) {
      return;
    }

    if (
      nextStatus === "suspended" &&
      !window.confirm(
        `Suspend ${employee.name}? This will revoke their access to FI360. You can reactivate the account later.`
      )
    ) {
      return;
    }

    setPendingEmployeeId(employee.id);
    try {
      const updated = await updateOrganizationUserStatus(employee.id, nextStatus);
      setEmployees((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success(
        nextStatus === "suspended"
          ? `${employee.name}'s account was suspended.`
          : `${employee.name}'s account was reactivated.`
      );
      await loadEmployees(true);
    } catch (error) {
      toast.error(describeRequestError(error));
      if (error instanceof ApiRequestError && error.status === 401) {
        void refreshSession();
      }
    } finally {
      setPendingEmployeeId(null);
    }
  };

  if (!canManageUsers) {
    return (
      <section className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <h1 className="font-semibold text-slate-900 dark:text-white">Access restricted</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Only an organization owner or administrator can manage employee accounts.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Employee Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create and manage accounts for your organization. Employee access and permissions follow their assigned role.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadEmployees(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsFormOpen((open) => !open)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          >
            {isFormOpen ? <Plus className="h-4 w-4 rotate-45" /> : <UserPlus className="h-4 w-4" />}
            {isFormOpen ? "Close form" : "Add employee"}
          </button>
        </div>
      </header>

      {loadError && employees.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Could not load employees</p>
            <p className="mt-1">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadEmployees(true)}
            className="shrink-0 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {isFormOpen && (
        <section
          aria-labelledby="add-employee-heading"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        >
          <div className="mb-5">
            <h2 id="add-employee-heading" className="text-base font-semibold text-slate-900 dark:text-white">
              Add an employee
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Their account will belong to your organization. Share the initial password securely with the employee.
            </p>
          </div>
          <form onSubmit={handleCreateEmployee} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="employee-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Full name
              </label>
              <input
                id="employee-name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="employee-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Work email
              </label>
              <input
                id="employee-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="employee-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Initial password
              </label>
              <input
                id="employee-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className={inputClassName}
                aria-describedby="employee-password-help"
              />
              <p id="employee-password-help" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Use at least 8 characters. The backend enforces its password requirements.
              </p>
            </div>
            <div>
              <label htmlFor="employee-role" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Role
              </label>
              <select
                id="employee-role"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))}
                className={inputClassName}
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>{ROLE_CONFIGS[role].label}</option>
                ))}
              </select>
              {user.role !== "owner" && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Only the organization owner can assign owner or administrator roles.
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-1 sm:col-span-2">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setForm({ name: "", email: "", password: "", role: "fleet_manager" });
                }}
                disabled={isCreating}
                className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCreating ? "Creating account..." : "Create employee"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section
        aria-labelledby="employee-list-heading"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <h2 id="employee-list-heading" className="text-base font-semibold text-slate-900 dark:text-white">
              Organization employees
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {employees.length} {employees.length === 1 ? "account" : "accounts"}
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        </div>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
            Loading organization employees...
          </div>
        ) : loadError && employees.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="mx-auto h-9 w-9 text-rose-500" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">Employee list unavailable</h3>
            <p role="alert" className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void loadEmployees(true)}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : employees.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <UserPlus className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">No employees found</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Add an employee account to give a member of your organization access to FI360.
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Employee</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-6">Account access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {employees.map((employee) => {
                  const isOwner = employee.role === "owner";
                  const isAdminManagedByAdmin = employee.role === "admin" && user.role !== "owner";
                  const isSelf = employee.id === user.id;
                  const isBusy = pendingEmployeeId === employee.id;
                  const permittedRoles = user.role === "owner"
                    ? (Object.keys(ROLE_CONFIGS) as UserRole[])
                    : (Object.keys(ROLE_CONFIGS) as UserRole[]).filter(
                        (role) => !ADMINISTRATIVE_ROLES.includes(role)
                      );
                  const roleOptions = Array.from(new Set([employee.role, ...permittedRoles]));
                  const cannotSuspend = isOwner || isAdminManagedByAdmin || (isSelf && employee.status === "active");

                  return (
                    <tr key={employee.id}>
                      <td className="px-4 py-4 sm:px-6">
                        <p className="font-medium text-slate-900 dark:text-white">{employee.name}</p>
                        <p className="mt-0.5 break-all text-xs text-slate-500 dark:text-slate-400">{employee.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <label className="sr-only" htmlFor={`employee-role-${employee.id}`}>
                          Role for {employee.name}
                        </label>
                        <select
                          id={`employee-role-${employee.id}`}
                          value={employee.role}
                          disabled={isBusy || Boolean(pendingEmployeeId) || isOwner || isAdminManagedByAdmin}
                          onChange={(event) => {
                            const nextRole = event.target.value;
                            if (Object.prototype.hasOwnProperty.call(ROLE_CONFIGS, nextRole)) {
                              void handleRoleChange(employee, nextRole as UserRole);
                            }
                          }}
                          className="max-w-64 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          title={isOwner ? "Organization owner roles cannot be changed here." : isAdminManagedByAdmin ? "Only the owner can manage an administrator's role." : undefined}
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>{ROLE_CONFIGS[role].label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            employee.status === "active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : employee.status === "suspended"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right sm:px-6">
                        <button
                          type="button"
                          onClick={() => void handleStatusChange(employee)}
                          disabled={isBusy || Boolean(pendingEmployeeId) || cannotSuspend}
                          title={
                            isOwner
                              ? "Organization owner accounts cannot be changed here."
                              : isAdminManagedByAdmin
                                ? "Only the owner can manage an administrator's status."
                                : isSelf && employee.status === "active"
                                  ? "You cannot suspend your own account."
                                  : undefined
                          }
                          className="inline-flex min-h-9 min-w-28 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {employee.status === "active" ? "Suspend access" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
