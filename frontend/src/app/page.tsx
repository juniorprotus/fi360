"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Truck,
  Wrench,
  ClipboardCheck,
  Disc,
  Fuel,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CheckCircle,
  TrendingDown,
  Gauge,
  Layers,
  ChevronRight,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Check,
  PhoneCall,
  Award,
  Menu,
  X,
} from "lucide-react";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [activePersona, setActivePersona] = useState<"manager" | "tech" | "dispatcher" | "driver">("manager");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeOutcomeCard, setActiveOutcomeCard] = useState(0);
  const outcomeScrollRef = useRef<HTMLDivElement>(null);

  // Auto-rotate outcome cards on mobile every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveOutcomeCard((prev) => (prev + 1) % 5);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll outcome carousel on mobile when active card changes
  useEffect(() => {
    if (outcomeScrollRef.current && window.innerWidth < 768) {
      const container = outcomeScrollRef.current;
      const card = container.children[activeOutcomeCard] as HTMLElement;
      if (card) {
        container.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
      }
    }
  }, [activeOutcomeCard]);

  const personas = {
    manager: {
      role: "Fleet Managers",
      title: "Real-time visibility into every asset, repair order, and dollar spent.",
      description:
        "Eliminate guesswork with live fleet readiness scores, automated maintenance intervals, and predictive cost-per-kilometer intelligence.",
      bullets: [
        "Live fleet availability and readiness dashboard",
        "Automated preventive maintenance schedules by odometer and engine hours",
        "Total cost of ownership (TCO) breakdown per vehicle and route",
        "Direct warranty and service history tracking",
      ],
      tag: "Executive Command",
      stat: "38% Lower Downtime",
    },
    tech: {
      role: "Workshop Techs",
      title: "Paperless work orders, staged parts, and faster bay turnaround.",
      description:
        "Equip technicians with digital work orders, step-by-step repair checklists, and instant parts staging so bays never sit idle waiting for authorization.",
      bullets: [
        "Automated work order creation from failed driver eDVIRs",
        "Parts catalog and inventory staging with reorder alerts",
        "Labor time tracking and technician productivity logs",
        "Component replacement histories and torque/spec references",
      ],
      tag: "Shop Floor Velocity",
      stat: "2.4x Faster Repairs",
    },
    dispatcher: {
      role: "Dispatchers",
      title: "Never dispatch a vehicle scheduled for urgent maintenance.",
      description:
        "Seamless synchronization between maintenance status and active haulage manifests prevents roadside breakdowns and customer delivery penalties.",
      bullets: [
        "Real-time maintenance lockouts prevent dispatching defective units",
        "Route fuel consumption and idle-time waste monitoring",
        "Live driver compliance and medical certificate tracking",
        "Instant defect reassignment to standby replacement units",
      ],
      tag: "Zero Disruptions",
      stat: "99.4% On-Time Gate Release",
    },
    driver: {
      role: "Drivers",
      title: "Frictionless 90-second digital eDVIR inspections from any phone.",
      description:
        "Drivers complete pre-trip and post-trip electronic inspections with photo defect attachments. Passed checks generate instant gate passes.",
      bullets: [
        "Fast 90-second mobile pre-trip and post-trip walkaround forms",
        "One-tap photo uploads for tyre cuts, leaks, and body damage",
        "Instant digital roadside compliance record for law enforcement",
        "Clear pass/fail sign-off eliminating paper carbon copies",
      ],
      tag: "Driver Experience",
      stat: "90s Inspection Time",
    },
  };

  const capabilities = [
    {
      title: "Workshop & Work Orders",
      benefit: "Cut repair backlogs and automate preventive PM cycles.",
      desc: "Automatically schedule servicing based on live odometer and engine telemetry. Manage technician bay capacity and track parts inventory down to the nut.",
      icon: Wrench,
      highlight: "2.4x Bay Turnaround",
      accent: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",
    },
    {
      title: "Electronic Inspections (eDVIR)",
      benefit: "Eliminate paper logs with instant defect-to-repair workflows.",
      desc: "DOT/DVSA-compliant pre-trip and post-trip smartphone inspections. Any failed check instantly generates a prioritized workshop work order.",
      icon: ClipboardCheck,
      highlight: "100% Audit Ready",
      accent: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/60",
    },
    {
      title: "Gemini AI Predictive Diagnostics",
      benefit: "Forecast component failures up to 14 days before breakdown.",
      desc: "Our machine learning engine analyzes sensor telemetry patterns to flag thermal anomalies, alternator decline, and brake wear before roadside failures occur.",
      icon: Sparkles,
      highlight: "-41% Roadside Calls",
      accent: "text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/60",
    },
    {
      title: "Tyre Lifecycle Management",
      benefit: "Maximize casing lifespan and track tread wear per axle.",
      desc: "Log millimeter tread depths, monitor pressure thresholds, schedule rotation intervals, and track retread histories to reduce your second-largest operating cost.",
      icon: Disc,
      highlight: "+28% Tyre Longevity",
      accent: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
    },
    {
      title: "Fuel & Energy Analytics",
      benefit: "Reconcile fuel cards and flag siphoning or idle waste.",
      desc: "Detect fuel theft, verify pump receipts against live tank level telemetry, and monitor excessive idling to slash fleet consumption by up to 14%.",
      icon: Fuel,
      highlight: "-14% Fuel Waste",
      accent: "text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60",
    },
    {
      title: "Fleet & Asset Registry",
      benefit: "A single source of truth for every vehicle and trailer.",
      desc: "Comprehensive lifecycle tracking: purchase agreements, depreciation curves, VIN decode, licensing expiries, and preventative service histories.",
      icon: Truck,
      highlight: "Complete Asset Records",
      accent: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    },
  ];

  const pricingTiers = [
    {
      name: "Starter",
      tagline: "Essential maintenance control and digital inspections for small commercial fleets.",
      price: billingCycle === "annual" ? "$4" : "$5",
      unit: "per asset / month",
      popular: false,
      features: [
        "Up to 25 fleet vehicles or trailers",
        "2 Fleet Manager & Admin seats",
        "Unlimited driver mobile eDVIR inspections",
        "Vehicle registry & document expiry alerts",
        "Preventive maintenance calendar (PM)",
        "Standard CSV data export",
      ],
      cta: "Start 14-Day Free Trial",
      href: "/register?plan=Starter",
    },
    {
      name: "Professional",
      tagline: "The complete outcome-driven fleet maintenance operating system for growing fleets.",
      price: billingCycle === "annual" ? "$8" : "$10",
      unit: "per asset / month",
      popular: true,
      features: [
        "26 to 200 fleet vehicles & equipment",
        "Unlimited team users, technicians & drivers",
        "Full Workshop & Work Order management",
        "Gemini AI Predictive Maintenance alerts",
        "Tyre tread tracking & fuel card reconciliation",
        "Telematics API connectors (Geotab, Samsara)",
        "Priority technical support & onboarding",
      ],
      cta: "Try Professional Free",
      href: "/register?plan=Professional",
    },
    {
      name: "Enterprise",
      tagline: "Custom architecture, dedicated SLAs, and ERP integrations for large transport operations.",
      price: "Custom",
      unit: "tailored volume pricing",
      popular: false,
      features: [
        "Unlimited assets, locations, and sub-fleets",
        "Dedicated Multi-Tenant deployment instance",
        "Custom ERP sync (SAP, NetSuite, Oracle)",
        "SAML 2.0 Single Sign-On (SSO) & Custom RBAC",
        "99.99% Guaranteed uptime service level agreement",
        "Dedicated Technical Account Manager & 24/7 SLA",
      ],
      cta: "Book an Enterprise Demo",
      href: "/register?plan=Enterprise",
    },
  ];

  const outcomeCards = [
    {
      name: "Apex Haulage Logistics",
      type: "Heavy Transport",
      image: "/images/industries/apex-haulage.jpg",
      metric: "$280k",
      metricLabel: "Annual Maintenance Savings",
      story: "Avoided $280k in unnecessary heavy-duty repairs annually through predictive component wear monitoring and automated PM triggers.",
      link: "Read the Apex story",
    },
    {
      name: "Vanguard Cold Chain",
      type: "Refrigerated Freight",
      image: "/images/industries/vanguard-cold.jpg",
      metric: "99.4%",
      metricLabel: "Temperature Compliance Rate",
      story: "Maintained 99.4% on-time temperature compliance across multi-zone reefer trailer networks with real-time sensor integrations.",
      link: "Read the Vanguard story",
    },
    {
      name: "Titan Infrastructure",
      type: "Civil Equipment",
      image: "/images/industries/titan-civil.jpg",
      metric: "42%",
      metricLabel: "Downtime Reduction",
      story: "Reduced jobsite machine downtime by 42% with real-time telematics health checks and automated preventive scheduling.",
      link: "Read the Titan story",
    },
    {
      name: "Metro Transit Hubs",
      type: "Passenger Fleet",
      image: "/images/industries/metro-transit.jpg",
      metric: "99.8%",
      metricLabel: "Dispatch Reliability",
      story: "Achieved 99.8% peak-hour dispatch reliability across municipal bus fleets with automated compliance audits and defect lockouts.",
      link: "Read the Metro story",
    },
    {
      name: "Nexus Intermodal",
      type: "Container Haulage",
      image: "/images/industries/nexus-intermodal.jpg",
      metric: "3.2x",
      metricLabel: "Asset Utilization Velocity",
      story: "Accelerated chassis and gantry container turnaround velocity by 3.2x with unified yard tracking and dispatch coordination.",
      link: "Read the Nexus story",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* 1. Slim Top Announcement Bar */}
      <div className="relative z-50 border-b border-emerald-900/10 bg-emerald-900/5 px-4 py-2 text-center text-xs font-medium text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
            New
          </span>
          <span className="hidden sm:inline">
            <strong>Gemini AI Predictive Maintenance:</strong> Forecast component degradation up to 14 days before breakdown.
          </span>
          <span className="sm:hidden text-[11px]">
            <strong>Gemini AI:</strong> Predict failures 14 days early.
          </span>
          <a
            href="#predictive-ai"
            className="inline-flex items-center font-bold underline hover:text-emerald-700 dark:hover:text-emerald-200 ml-1"
          >
            <span className="hidden sm:inline">Explore AI Engine</span>
            <span className="sm:hidden">Learn more</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 2. Top Navigation with Mobile Hamburger */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 transition-colors">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700/80 shadow-sm shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src="/icon.png"
                  alt="FI360 Logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                  FI360
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Fleet Intelligence Platform
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <a href="#outcomes" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                Outcomes
              </a>
              <a href="#capabilities" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                Capabilities
              </a>
              <a href="#predictive-ai" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                Predictive AI
              </a>
              <a href="#connectivity" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                Platform Scale
              </a>
              <a href="#pricing" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                Pricing
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-1.5 transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="hidden md:inline-flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Live Demo
            </Link>
            <Link
              href="/register?mode=demo"
              className="hidden sm:inline-flex rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 shadow-sm shadow-emerald-700/20 transition items-center gap-1.5"
            >
              <span>Book a Demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            {/* Mobile Hamburger */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pb-4 pt-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {[
              { label: "Outcomes", href: "#outcomes" },
              { label: "Capabilities", href: "#capabilities" },
              { label: "Predictive AI", href: "#predictive-ai" },
              { label: "Platform Scale", href: "#connectivity" },
              { label: "Pricing", href: "#pricing" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="block text-center rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/register?mode=demo"
                className="block text-center rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-4 py-2.5 shadow-sm transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book a Demo
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 3. Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-[#eef3f0] via-[#f5f8f6] to-slate-50 dark:from-[#1b2320] dark:via-[#212626] dark:to-[#272829] pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28 transition-colors">
        {/* Subtle Ambient Radial Lighting */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55rem_45rem_at_50%_10%,rgba(16,185,129,0.08),transparent)] dark:bg-[radial-gradient(55rem_45rem_at_50%_10%,rgba(16,185,129,0.12),transparent)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Column: Outcome Copy & CTAs */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-left">
              {/* Social Proof */}
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-3 py-1 text-[11px] sm:text-xs font-medium text-slate-800 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Trusted by commercial fleets managing <strong>12,000+ assets</strong>
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
                Keep every vehicle moving.{" "}
                <span className="text-emerald-800 dark:text-emerald-400">
                  Fleet maintenance, under complete control.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
                FI360 gives operators, technicians, and fleet leaders the single system to eliminate unscheduled vehicle downtime, lower cost-per-kilometer, and keep daily inspections and work orders moving forward.
              </p>

              {/* CTAs */}
              <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/register?mode=demo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-800/25 transition active:scale-[0.99]"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Book a 15-Minute Demo</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Quick Confidence Markers */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  No hardware lock-in
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  Instant cloud onboarding
                </span>
              </div>
            </div>

            {/* Right Column: Product Mockup */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto rounded-2xl border border-slate-300/80 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-700/80 dark:bg-slate-900 overflow-hidden">
                {/* Mockup Window Chrome */}
                <div className="flex h-9 sm:h-11 items-center justify-between border-b border-slate-200/80 bg-slate-100/80 px-3 sm:px-4 dark:border-slate-800 dark:bg-slate-950/80">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="ml-2 font-mono text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                      fi360.app/workshop/wo-4092
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="hidden xs:inline">Live Workshop Bay</span>
                      <span className="xs:hidden">Live</span>
                    </span>
                  </div>
                </div>

                {/* Mockup Work Order Content */}
                <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          WO-4092
                        </span>
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
                          High Priority PM
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
                        Volvo FH16 Globetrotter (Unit #TRK-104)
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                        Odometer: 248,190 km &bull; Long-Haul Freight Division
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">Turnaround Target</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">2h 15m remaining</div>
                      </div>
                    </div>
                  </div>

                  {/* Gemini AI Advisory */}
                  <div className="rounded-xl border border-purple-200/80 bg-purple-50/70 p-3 sm:p-3.5 dark:border-purple-900/50 dark:bg-purple-950/30">
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      <div className="rounded-lg bg-purple-600 p-1.5 text-white shrink-0 mt-0.5">
                        <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-[11px] sm:text-xs font-bold text-purple-900 dark:text-purple-300">
                            Gemini AI Predictive Advisory
                          </span>
                          <span className="text-[10px] font-mono text-purple-700 dark:text-purple-400">
                            Confidence: 96%
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-purple-800 dark:text-purple-300/90 mt-1 leading-snug">
                          Telemetry variance detected in Axle 2 brake pad wear pattern (+18% delta vs. baseline). Pre-emptive pad replacement scheduled 380 km before warning threshold.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Repair Checklist */}
                  <div className="space-y-2">
                    <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Service Checklist &amp; Staged Parts
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-2 sm:p-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs">120-Point eDVIR Sync</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Verified</span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-2 sm:p-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs">Synthetic 15W-40 Oil Flush</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Completed</span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 p-2 sm:p-2.5 sm:col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                          <span className="font-medium text-blue-900 dark:text-blue-300 text-[11px] sm:text-xs">
                            Brake Pad Set &amp; Caliper Re-Torque (Bay 04)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">68% Done</span>
                      </div>
                    </div>
                  </div>

                  {/* Technician Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl bg-slate-50 px-3 sm:px-3.5 py-2 sm:py-2.5 border border-slate-200/80 dark:bg-slate-950/80 dark:border-slate-800 text-xs gap-2 sm:gap-0">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                        MV
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px] sm:text-xs">
                        Marcus Vance (Lead Tech)
                      </span>
                    </div>
                    <div className="font-mono text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                      $540.00 parts staged &bull; 2.2 hrs logged
                    </div>
                  </div>
                </div>

                {/* Floating Metric Badge */}
                <div className="hidden md:flex absolute bottom-4 right-4 items-center gap-3 rounded-xl border border-emerald-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-emerald-900 dark:bg-slate-900/95">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      -42 Hours Downtime Prevented
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Est. $3,850 road-call savings this month
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Horizontal Metric Strip */}
      <section id="outcomes" className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 sm:py-12 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: "99.4%", label: "Fleet Operational Uptime", detail: "Across 12,000+ active commercial assets.", accent: false },
              { value: "-38%", label: "Unscheduled Roadside Downtime", detail: "Through automated PM interval triggers.", accent: true },
              { value: "2.4x", label: "Faster Work Order Turnaround", detail: "From driver inspection defect to gate clearance.", accent: false },
              { value: "$0.18", label: "Average Cost Saved Per Km", detail: "In tyre lifecycle, idle waste, and parts staging.", accent: true },
            ].map((metric, idx) => (
              <div key={idx} className={`px-2 sm:px-4 ${idx >= 2 ? "pt-4 sm:pt-0" : ""} text-center sm:text-left`}>
                <div className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono tracking-tight ${metric.accent ? "text-emerald-700 dark:text-emerald-400" : "text-slate-950 dark:text-white"}`}>
                  {metric.value}
                </div>
                <div className={`text-[11px] sm:text-xs lg:text-sm font-bold mt-1 ${metric.accent ? "text-slate-900 dark:text-white" : "text-emerald-700 dark:text-emerald-400"}`}>
                  {metric.label}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Proven Fleet Outcomes — Fleetio-Style Proof Section (Redesigned) */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold tracking-widest text-emerald-700 dark:text-emerald-400 uppercase">
              Proven Fleet Outcomes
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              The proof is in the numbers
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              See how leading commercial fleets reduce downtime, eliminate unnecessary repairs, and maintain 99%+ operational compliance with FI360.
            </p>
          </div>

          {/* Top Row: 3 Large Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-5 sm:mb-6">
            {outcomeCards.slice(0, 3).map((card) => (
              <div
                key={card.name}
                className="group relative flex flex-col justify-end overflow-hidden rounded-2xl min-h-[340px] sm:min-h-[380px] lg:min-h-[420px] shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                {/* Background Image */}
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-center brightness-[0.75] contrast-[1.05] transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-[0.82]"
                />

                {/* Gradient Scrim */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-emerald-400/30 transition-colors pointer-events-none" />

                {/* Top: Industry Type Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-300 border border-white/10">
                    {card.type}
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="relative z-10 p-5 sm:p-6 space-y-2">
                  {/* Big Metric */}
                  <div className="flex items-end gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg leading-none">
                      {card.metric}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-emerald-300">
                    {card.metricLabel}
                  </p>

                  {/* Company Name & Story */}
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug pt-1">
                    {card.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed line-clamp-2">
                    {card.story}
                  </p>

                  {/* CTA Link */}
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors">
                      {card.link}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Row: 2 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {outcomeCards.slice(3).map((card) => (
              <div
                key={card.name}
                className="group relative flex flex-col justify-end overflow-hidden rounded-2xl min-h-[280px] sm:min-h-[320px] lg:min-h-[340px] shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                {/* Background Image */}
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center brightness-[0.75] contrast-[1.05] transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-[0.82]"
                />

                {/* Gradient Scrim */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-emerald-400/30 transition-colors pointer-events-none" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-300 border border-white/10">
                    {card.type}
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="relative z-10 p-5 sm:p-6">
                  <div className="flex items-end gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-end gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg leading-none">
                          {card.metric}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-emerald-300">
                        {card.metricLabel}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug mt-3">
                    {card.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed mt-1 line-clamp-2">
                    {card.story}
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors">
                      {card.link}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Core Business Capabilities */}
      <section id="capabilities" className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Operational Capabilities
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Engineered to eliminate friction between drivers, bays, and dispatch
            </p>
            <p className="mt-3 sm:mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every tool required to run a high-utilization commercial fleet. Adopt as an all-in-one suite or connect directly into your existing enterprise workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/60 transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className={`inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl p-2 sm:p-2.5 border ${cap.accent}`}>
                        <Icon className="h-full w-full" />
                      </div>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 sm:px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {cap.highlight}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                      {cap.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300/90 mb-2">
                      {cap.benefit}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>
                  <div className="pt-4 sm:pt-5 mt-3 sm:mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    <span>Learn capability workflows</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Role-Tailored Intelligence - Persona Deep-Dive */}
      <section className="py-16 sm:py-20 bg-slate-50/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Role-Tailored Intelligence
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              One unified platform. Zero disconnected silos.
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Select a stakeholder role to see how FI360 streamlines daily operations from gate to bay.
            </p>

            {/* Persona Switcher - Horizontal scroll on mobile */}
            <div className="mt-6 sm:mt-8 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
              <div className="inline-flex rounded-xl p-1 sm:p-1.5 bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700 whitespace-nowrap">
                {(Object.keys(personas) as Array<keyof typeof personas>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivePersona(key)}
                    className={`rounded-lg px-3 sm:px-3.5 py-2 text-[11px] sm:text-xs font-bold transition whitespace-nowrap ${
                      activePersona === key
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {personas[key].role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Persona Showcase Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-xl max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] sm:text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <Award className="h-3.5 w-3.5" />
                  <span>{personas[activePersona].tag}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  {personas[activePersona].title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {personas[activePersona].description}
                </p>

                <div className="pt-1 sm:pt-2 space-y-2 sm:space-y-2.5">
                  {personas[activePersona].bullets.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 sm:pt-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    <span>Launch interactive role workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 sm:p-6 text-center space-y-3 sm:space-y-4">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                  {personas[activePersona].stat}
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Measured fleet operational outcome
                </p>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 sm:pt-4 text-left space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Live Operational Guarantee
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Designed for high-tempo freight environments where every delayed minute incurs penalties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Predictive AI Deep-Dive */}
      <section id="predictive-ai" className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] sm:text-xs font-bold text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Google Gemini Telematics Intelligence</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Predictive maintenance that prevents the roadside tow truck
              </h2>

              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Traditional fleet software alerts you after a check-engine light is already flashing. FI360 ingests raw CANbus/OBD-II telemetry, route terrain, and ambient weather to catch micro-wear patterns days before a catastrophic failure.
              </p>

              <div className="mt-5 sm:mt-6 space-y-3 sm:space-y-3.5 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2 sm:gap-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>14-Day Failure Forecast:</strong> Catch alternator voltage drops, cooling loop pressure leaks, and transmission slippage ahead of roadside breakdowns.
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Automated Shop Scheduling:</strong> Staged work orders trigger parts procurement automatically, eliminating multi-day parts lead delays.
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Cost Avoidance Accounting:</strong> Live reporting on exact dollar savings from prevented towing fees, overtime shop hours, and customer SLA penalties.
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href="/register?mode=demo"
                  className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-5 py-3 shadow-md shadow-purple-700/20 transition flex items-center justify-center gap-1.5"
                >
                  <span>See Predictive AI in Action</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline text-center sm:text-left"
                >
                  View Sample Telematics Output &rarr;
                </Link>
              </div>
            </div>

            {/* AI Telematics Visual Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-600" />
                  <span className="font-mono text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">
                    TELEMETRICS ANOMALY MONITOR
                  </span>
                </div>
                <span className="rounded bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-purple-700 dark:text-purple-300">
                  REAL-TIME CANBUS
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 sm:p-3.5 dark:border-rose-900/40 dark:bg-rose-950/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs font-bold text-rose-900 dark:text-rose-300 gap-1">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      Critical Flag: Unit #TRK-88 Turbo Boost Sensor
                    </span>
                    <span className="font-mono text-[10px] text-rose-700 dark:text-rose-400">98% Risk</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-rose-800 dark:text-rose-300/80 mt-1">
                    Exhaust manifold pressure variance of +2.4 PSI above manufacturer curve. Work Order #WO-4112 auto-generated with replacement gasket staged.
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 sm:p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs font-bold text-emerald-900 dark:text-emerald-300 gap-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Normalized: Unit #VAN-204 Alternator Health
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">Stable</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-300/80 mt-1">
                    14.2V constant output across 680 km haulage route. Inspection cleared for upcoming 3-day regional dispatch.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 dark:border-slate-800 dark:bg-slate-900 text-xs">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px] sm:text-xs">
                    <span>Fleet Mechanical Health Index</span>
                    <span className="font-mono font-bold text-emerald-600">94.8 / 100</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-1000" style={{ width: "94.8%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Enterprise Integration & Connectivity */}
      <section id="connectivity" className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Enterprise Integration
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Connectable by design. Ready for your existing tech stack.
            </p>
            <p className="mt-3 sm:mt-4 text-sm text-slate-600 dark:text-slate-400">
              Never get locked into a closed monolithic ecosystem. FI360 connects bi-directionally with your ERP, accounting software, fuel card providers, and existing telematics hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { icon: Gauge, title: "Hardware & Telematics Agnostic", desc: "Connect Geotab, Samsara, Verizon Connect, or standard OBD-II trackers. Switch device providers without losing your maintenance history.", color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40" },
              { icon: Layers, title: "ERP & General Ledger Sync", desc: "Export parts purchase orders and work order labor directly to SAP, NetSuite, QuickBooks, or Xero for audited cost accounting.", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" },
              { icon: ShieldCheck, title: "Enterprise Security & RBAC", desc: "SAML 2.0 / Okta single sign-on, granular role-based access control, SOC2-ready protocols, and strict multi-tenant database isolation.", color: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40" },
              { icon: Zap, title: "Comprehensive REST & Webhooks", desc: "Full-fidelity REST APIs and instant webhooks for odometer alerts, inspection flags, and work order transitions to trigger custom actions.", color: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
                  <div className={`rounded-xl ${item.color} p-3 w-fit mb-4`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. Social Proof & Customer Case Studies */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Commercial Proven Results
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              What transport leaders achieve with FI360
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                Verified Commercial Fleet Deployment
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic">
                &ldquo;We dropped unscheduled roadside service calls by 41% in our first six months with FI360. Our shop technicians know exactly which parts to pull before a truck even rolls into the bay.&rdquo;
              </p>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    David Chen
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    VP of Fleet Operations &bull; Apex Haulage (340 Trucks)
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  -41% Downtime
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                Verified Commercial Fleet Deployment
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic">
                &ldquo;The mobile eDVIR to work-order workflow shaved nearly an hour off our daily morning gate release. Inspections are actually verified, compliance is ironclad, and fuel anomalies are flagged instantly.&rdquo;
              </p>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Sarah Jenkins
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Maintenance Superintendent &bull; Vanguard Cold Chain
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  52m Saved Daily
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Pricing */}
      <section id="pricing" className="py-16 sm:py-20 bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Predictable Pricing
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Priced to deliver a 5x return in operational savings
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              14-day free trial on all plans. No credit card required to get started.
            </p>

            {/* Billing Toggle */}
            <div className="mt-6 sm:mt-8 inline-flex items-center gap-2 sm:gap-3 rounded-full border border-slate-300 bg-white p-1 shadow-xs dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold transition ${
                  billingCycle === "monthly"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold transition ${
                  billingCycle === "annual"
                    ? "bg-emerald-700 text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <span>Annual</span>
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-900">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-6 sm:p-8 flex flex-col justify-between transition relative ${
                  tier.popular
                    ? "border-emerald-600 bg-white shadow-xl shadow-emerald-700/10 dark:border-emerald-500 dark:bg-slate-900"
                    : "border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-700 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm whitespace-nowrap">
                    Most Popular For Fleets
                  </div>
                )}

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {tier.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px] sm:min-h-[36px]">
                    {tier.tagline}
                  </p>

                  <div className="my-5 sm:my-6">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white font-mono">
                      {tier.price}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 ml-2">
                      {tier.unit}
                    </span>
                  </div>

                  <div className="space-y-2.5 sm:space-y-3 border-t border-slate-100 dark:border-slate-800 pt-5 sm:pt-6">
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      What&apos;s Included:
                    </div>
                    {tier.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 sm:pt-8">
                  <Link
                    href={tier.href}
                    className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 sm:py-3 px-4 text-xs font-bold transition shadow-sm ${
                      tier.popular
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/25"
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

      {/* 12. Final High-Impact Closing CTA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-[#eef3f0] to-[#e4ece7] dark:from-[#1b2320] dark:to-[#222728] border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Ready for Immediate Deployment</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight">
            Stop losing hours to vehicle downtime and shop delays
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of transport operators who have traded paper work orders and breakdown panic for total maintenance visibility.
          </p>

          <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register?mode=demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-bold text-white shadow-lg shadow-emerald-800/30 transition active:scale-[0.99]"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Book a 15-Minute Demo</span>
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pt-2">
            No credit card required &bull; 15-minute setup &bull; Compatible with all fleet hardware
          </p>
        </div>
      </section>

      {/* 13. Footer */}
      <footer className="bg-white dark:bg-slate-950 py-12 sm:py-16 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-10 sm:mb-12">
            {/* Brand Column */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Image
                    src="/icon.png"
                    alt="FI360 Logo"
                    width={26}
                    height={26}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  FI360
                </span>
              </Link>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                Fleet Intelligence 360 is the outcome-driven fleet management and maintenance operating system designed to keep commercial vehicles moving and eliminate unscheduled downtime.
              </p>
              <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 dark:bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Platform Services Operational &bull; 99.99% SLA</span>
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-3">
              <div className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-[11px]">
                Capabilities
              </div>
              <ul className="space-y-2">
                <li><a href="#capabilities" className="hover:text-slate-900 dark:hover:text-white transition">Workshop &amp; Work Orders</a></li>
                <li><a href="#capabilities" className="hover:text-slate-900 dark:hover:text-white transition">Electronic eDVIR</a></li>
                <li><a href="#predictive-ai" className="hover:text-slate-900 dark:hover:text-white transition">Gemini AI Diagnostics</a></li>
                <li><a href="#capabilities" className="hover:text-slate-900 dark:hover:text-white transition">Tyre Lifecycle Control</a></li>
                <li><a href="#capabilities" className="hover:text-slate-900 dark:hover:text-white transition">Fuel Telemetry &amp; Waste</a></li>
                <li><a href="#capabilities" className="hover:text-slate-900 dark:hover:text-white transition">Fleet &amp; Asset Registry</a></li>
              </ul>
            </div>

            {/* Platform */}
            <div className="space-y-3">
              <div className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-[11px]">
                Platform
              </div>
              <ul className="space-y-2">
                <li><a href="#connectivity" className="hover:text-slate-900 dark:hover:text-white transition">Telematics Integrations</a></li>
                <li><a href="#connectivity" className="hover:text-slate-900 dark:hover:text-white transition">ERP Accounting Sync</a></li>
                <li><a href="#connectivity" className="hover:text-slate-900 dark:hover:text-white transition">Security &amp; SAML SSO</a></li>
                <li><a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition">Pricing &amp; Plans</a></li>
                <li><Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition">Live Platform Demo</Link></li>
              </ul>
            </div>

            {/* Access */}
            <div className="space-y-3">
              <div className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-[11px]">
                Access
              </div>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-slate-900 dark:hover:text-white transition">Sign In to Workspace</Link></li>
                <li><Link href="/register" className="hover:text-slate-900 dark:hover:text-white transition">Start 14-Day Free Trial</Link></li>
                <li><Link href="/register?mode=demo" className="hover:text-slate-900 dark:hover:text-white transition">Schedule 15m Demo</Link></li>
                <li><Link href="/dashboard/settings" className="hover:text-slate-900 dark:hover:text-white transition">Organization Settings</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px]">
            <div>
              &copy; {new Date().getFullYear()} Fleet Intelligence 360 Inc. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
              <Link href="/security" className="hover:underline">Security Protocols</Link>
              <span>SOC2 Type II Certified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
