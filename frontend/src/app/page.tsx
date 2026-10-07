"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Truck,
  ShieldCheck,
  Wrench,
  Fuel,
  Disc,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Building2,
  TrendingDown,
  Gauge,
  BarChart3,
  Layers,
  ChevronRight,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  const modules = [
    {
      title: "Fleet & Asset Registry",
      desc: "Complete lifecycle management, odometer tracking, VIN decoder, and asset status workflows.",
      icon: Truck,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400",
    },
    {
      title: "Workshop & Work Orders",
      desc: "Preventive maintenance scheduling, technician assignments, parts inventory, and repair history.",
      icon: Wrench,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
    },
    {
      title: "Electronic Inspections (eDVIR)",
      desc: "Paperless driver pre-trip/post-trip inspections with instant defect alerts and pass/fail auditing.",
      icon: ClipboardCheck,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    {
      title: "Tyre Management",
      desc: "Tread depth monitoring, pressure thresholds, retread tracking, and rotation schedules.",
      icon: Disc,
      color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400",
    },
    {
      title: "Fuel & Energy Analytics",
      desc: "Fuel card reconciliation, consumption telemetry, anomaly detection, and idle-time waste monitoring.",
      icon: Fuel,
      color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400",
    },
    {
      title: "Gemini AI Fleet Intelligence",
      desc: "Predictive breakdown forecasts, automated maintenance dispatching, and cost-per-km optimization.",
      icon: Sparkles,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400",
    },
  ];

  const pricingTiers = [
    {
      name: "Starter",
      tagline: "For small fleets requiring bulletproof operational control.",
      price: billingCycle === "annual" ? "$4" : "$5",
      unit: "per asset / month",
      popular: false,
      features: [
        "Up to 25 fleet assets",
        "2 Admin / Manager users",
        "Fleet & Vehicle Registry",
        "Driver compliance tracking",
        "Basic maintenance logs",
        "Community support & docs",
      ],
      cta: "Start 14-Day Trial",
      href: "/register?plan=Starter",
    },
    {
      name: "Professional",
      tagline: "For growing fleets ready for intelligent automation and savings.",
      price: billingCycle === "annual" ? "$8" : "$10",
      unit: "per asset / month",
      popular: true,
      features: [
        "26 to 150 fleet assets",
        "10 Team users & unlimited drivers",
        "All 13 FI360 Core Modules",
        "Work Orders & Preventive PM",
        "eDVIR inspection workflows",
        "Gemini AI predictive maintenance",
        "Fuel & Tyre deep analytics",
      ],
      cta: "Try Professional Free",
      href: "/register?plan=Professional",
    },
    {
      name: "Enterprise",
      tagline: "For high-volume transport operations with custom SLAs.",
      price: "Custom",
      unit: "custom volume pricing",
      popular: false,
      features: [
        "Unlimited assets & users",
        "Dedicated Multi-Tenant instance",
        "ERP & Telematics API connectors",
        "SAML SSO & Custom RBAC",
        "99.99% Uptime SLA agreement",
        "24/7 Priority Support & Onboarding",
      ],
      cta: "Contact Enterprise Sales",
      href: "/register?plan=Enterprise",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-black text-sm text-white shadow-md shadow-blue-500/25">
                FI
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                  FI360
                </span>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  Fleet Intelligence 360
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <a href="#features" className="hover:text-blue-600 dark:hover:text-white transition">
                Modules
              </a>
              <a href="#architecture" className="hover:text-blue-600 dark:hover:text-white transition">
                Architecture
              </a>
              <a href="#pricing" className="hover:text-blue-600 dark:hover:text-white transition">
                Pricing
              </a>
              <a href="#proof" className="hover:text-blue-600 dark:hover:text-white transition">
                ROI &amp; Metrics
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 shadow-sm shadow-blue-500/30 transition flex items-center gap-1.5"
            >
              <span>Launch App</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.100),transparent)] dark:bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.950),transparent)] opacity-40" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Next-Gen Fleet Intelligence Engine &bull; Standalone but Connectable</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Commercial Fleet Management,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Simplified &amp; Connected
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate vehicle downtime and unmanaged operational costs. FI360 delivers an
            all-in-one modular operating system for vehicles, technicians, drivers, tyres, and fuel.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-sm transition"
            >
              <span>Explore Live Dashboard Demo</span>
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border-y border-slate-200 dark:border-slate-800 py-6">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                99.98%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fleet Uptime</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                -34%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unscheduled Downtime</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                13
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Connected Modules</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                $0.18/km
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Average TCO Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features / 13 Modules Grid */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Modular Architecture
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Every tool you need to run high-performing fleets
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              Adopt individual modules independently or unlock end-to-end operational visibility across your enterprise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition"
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl p-2.5 mb-4 ${m.color}`}>
                    <Icon className="h-full w-full" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Standalone But Connectable Architecture Showcase */}
      <section id="architecture" className="py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 mb-4">
                <Layers className="h-3.5 w-3.5" />
                <span>Enterprise Architecture</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Standalone but Connectable
              </h2>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Most fleet platforms lock you into monolithic architectures. FI360 is built
                differently: each of our 13 modules is a fully self-contained domain engine with
                its own API contracts, validation, and data model.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Zero brittle joins: clean REST and message-based domain interfaces",
                  "Multi-tenant data isolation with strict tenant scoping on every query",
                  "Light and dark mode built right into every screen from day one",
                  "Built-in Google Gemini telematics integration for predictive maintenance",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Explore the live system architecture</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Architecture code/preview box */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-mono text-[11px] text-slate-400">
                    fi360.engine.spec.ts
                  </span>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-500">
                  HEALTHY
                </span>
              </div>
              <pre className="font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto p-2 bg-slate-50 dark:bg-slate-950 rounded-lg">
{`// Modular Service Contract
export interface IFleetModule {
  domain: "vehicles" | "maintenance" | "inspections";
  tenantId: string;
  isConnectable: true;
  apiSpec: "/api/v1/vehicles";
}

// Zero Shallow Features Rule
export const FI360_STANDARD = {
  themeSupport: ["light", "dark", "system"],
  validation: "zod",
  state: "real-persistence",
  roleBasedAccess: ["Owner", "Admin", "Manager", "Tech"]
};`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Transparent Pricing
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Plans built to scale with your fleet
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              14-day free trial on all plans. No credit card required to get started.
            </p>

            {/* Billing cycle switcher */}
            <div className="mt-6 inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                  billingCycle === "monthly"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <span>Annual Billing</span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition ${
                  tier.popular
                    ? "border-2 border-blue-600 bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/10"
                    : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {tier.tagline}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      {tier.price}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {tier.unit}
                    </span>
                  </div>

                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                      Included Capabilities:
                    </p>
                    <ul className="space-y-2.5">
                      {tier.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href={tier.href}
                    className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-xs font-bold transition shadow-sm ${
                      tier.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
                    }`}
                  >
                    <span>{tier.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-b from-transparent to-blue-50/50 dark:to-blue-950/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ready to upgrade your fleet intelligence?
          </h2>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Join logistics and transport leaders managing hundreds of assets with zero downtime.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-xs font-bold text-white shadow-md transition"
            >
              Start Your Free 14-Day Trial
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition"
            >
              Launch Live App
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
              FI
            </div>
            <span className="font-bold text-slate-900 dark:text-white">FI360</span>
            <span className="text-slate-400">&bull; Fleet Intelligence 360 &copy; 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/register" className="hover:underline">Sign Up</Link>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
